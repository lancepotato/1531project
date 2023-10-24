import { getData, setData } from './dataStore';
import { error, messageId, channel, dm, message, SharedMessageId } from './interface';
import { getMessageId, isValidToken, findUserWithToken, hasMsgPermissions, isValidDmId, isDmMember, isValidCid, isMember, getMessageLocation, shareMessageToChat } from './helper';
import HTTPError from 'http-errors';
import { checkTags, notificationSend } from './notifications';
import { addUserMessageStat, addWorkspaceMessagesStat } from './stats';

/**
 * Sends a message to the specified channel
 * @param token token of user trying to send a message
 * @param channelId id of channel where user is trying to send a message
 * @param message string of message content
 * @param messageId (optional) sets the id of the message to be the given messageId
 * @returns messageId of the sent message
 */
export function messageSendV1(token: string, channelId: number, message: string, messageId?: number): error | messageId {
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  if (!isValidCid(channelId)) {
    throw HTTPError(400, 'invalid channel');
  }

  const uId = findUserWithToken(token).uId;
  if (!isMember(uId, channelId)) {
    throw HTTPError(403, 'user is not in channel');
  }

  if (message.length < 1) {
    throw HTTPError(400, 'message length is less than 1');
  }

  if (message.length > 1000) {
    throw HTTPError(400, 'message length is greater than 1000');
  }

  const data = getData();
  let newMessageId = messageId;
  if (messageId === undefined) {
    newMessageId = getMessageId();
  }

  const timeSent = Math.floor((new Date()).getTime() / 1000);
  const channelIndex = data.channels.findIndex(channel => channel.channelId === channelId);

  data.channels[channelIndex].messages.unshift(
    {
      messageId: newMessageId,
      uId: uId,
      message: message,
      timeSent: timeSent,
      reacts: [],
      isPinned: false
    }
  );
  const validTags = checkTags(message, data.channels[channelIndex]);
  if (validTags.length > 0) {
    notificationSend(token, validTags, 'channels', channelId, 'tag', message);
  }
  addUserMessageStat(uId);
  addWorkspaceMessagesStat('increase');
  setData(data);
  return { messageId: newMessageId };
}

/**
 * Sends a message to the specified dm
 * @param token token of user trying to send a message
 * @param dmId id of dm where user is trying to send a message
 * @param message string of message content
 * @returns messageId of the sent message
 */
export function messageSendDmV1(token: string, dmId: number, message: string, messageId?: number): messageId | error {
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  if (!isValidDmId(dmId)) {
    throw HTTPError(400, 'invalid dmId');
  }

  const uId = findUserWithToken(token).uId;
  if (!isDmMember(uId, dmId)) {
    throw HTTPError(403, 'user is not in DM');
  }

  if (message.length < 1) {
    throw HTTPError(400, 'message length is less than 1');
  }

  if (message.length > 1000) {
    throw HTTPError(400, 'message length is greater than 1000');
  }

  const data = getData();
  let newMessageId = messageId;
  if (messageId === undefined) {
    newMessageId = getMessageId();
  }

  const timeSent = Math.floor((new Date()).getTime() / 1000);
  const dmIndex = data.dms.findIndex(dm => dm.dmId === dmId);

  data.dms[dmIndex].messages.unshift(
    {
      messageId: newMessageId,
      uId: uId,
      message: message,
      timeSent: timeSent,
      reacts: [],
      isPinned: false,
    }
  );
  const validTags = checkTags(message, data.dms[dmIndex]);
  if (validTags.length > 0) {
    notificationSend(token, validTags, 'dms', dmId, 'tag', message);
  }
  addUserMessageStat(uId);
  addWorkspaceMessagesStat('increase');
  setData(data);
  return { messageId: newMessageId };
}

/**
 * Edits message given messageId
 * @param token token of user trying to edit a message
 * @param messageId to be edited messages's messageId
 * @param message string of edited message
 * @returns empty object if successful
 */
export function messageEditV1(token: string, messageId: number, message: string): error | Record<string, never> {
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  if (message.length > 1000) {
    throw HTTPError(400, 'message length is greater than 1000');
  }

  const data = getData();
  let chats: ('channels' | 'dms');

  if (data.channels.find(channel => channel.messages.some(message => message.messageId === messageId))) {
    chats = 'channels';
  } else if (data.dms.find(dm => dm.messages.some(message => message.messageId === messageId))) {
    chats = 'dms';
  } else {
    throw HTTPError(400, 'invalid messageId');
  }

  const user = findUserWithToken(token);
  const chatIndex = data[chats].findIndex((chat: (channel | dm)) => chat.messages.some(message => message.messageId === messageId));
  if (!data[chats][chatIndex].allMembers.includes(user.uId)) {
    throw HTTPError(400, 'user is not in channel that message is in');
  }

  const messageIndex = data[chats][chatIndex].messages.findIndex((message: message) => message.messageId === messageId);
  const foundMessage = data[chats][chatIndex].messages[messageIndex];
  const chat = data[chats][chatIndex];

  if (!hasMsgPermissions(user, chat, chats, foundMessage.uId)) {
    throw HTTPError(403, 'user is not author of message, and is not an owner');
  }

  if (message === '') {
    data[chats][chatIndex].messages.splice(messageIndex, 1);
    addWorkspaceMessagesStat('decrease');
  } else {
    data[chats][chatIndex].messages[messageIndex].message = message;
    let id: number;
    if (chats === 'channels') {
      id = data[chats][chatIndex].channelId;
    } else {
      id = data[chats][chatIndex].dmId;
    }
    const validTags = checkTags(message, data[chats][chatIndex]);
    if (validTags.length > 0) {
      notificationSend(token, validTags, chats, id, 'tag', message);
    }
  }

  setData(data);

  return {};
}
/**
 * Deletes a message given messageId
 * @param token token of user trying to remove a message
 * @param messageId if of message to be removed
 * @returns empty object if successful
 */
export function messageRemoveV1(token: string, messageId: number): error | Record<string, never> {
  return messageEditV1(token, messageId, '');
}

export function messageShare(token: string, ogMessageId: number, message: string, channelId: number, dmId: number): SharedMessageId {
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  if (message.length > 1000) {
    throw HTTPError(400, 'message length is greater than 1000');
  }

  if (!isValidCid(channelId) && !isValidDmId(dmId)) {
    throw HTTPError(400, 'invalid channelId and dmId');
  }

  if (channelId !== -1 && dmId !== -1) {
    throw HTTPError(400, 'neither channelId or dmId are -1');
  }

  const data = getData();
  const { type, chatIndex, messageIndex } = getMessageLocation(ogMessageId);
  const user = findUserWithToken(token);

  if (!data[type][chatIndex].allMembers.includes(user.uId)) {
    throw HTTPError(400, 'invalid messageId');
  }

  const dataMessage = data[type][chatIndex].messages[messageIndex];
  const sharedMessageId = getMessageId();
  let sharedMessage = '';
  if (message === '') {
    sharedMessage = dataMessage.message;
  } else {
    sharedMessage = dataMessage.message + ` ${message}`;
  }
  shareMessageToChat(channelId, dmId, sharedMessageId, sharedMessage, user);
  let id: number;
  let chat: (dm | channel);
  if (channelId === -1) {
    id = dmId;
    chat = data.dms.find(dm => dm.dmId === id);
  } else {
    id = channelId;
    chat = data.channels.find(channel => channel.channelId === id);
  }
  const validTags = checkTags(message, chat);
  if (validTags.length > 0) {
    notificationSend(token, validTags, type, id, 'tag', message);
  }
  addWorkspaceMessagesStat('increase');
  addUserMessageStat(user.uId);
  return { sharedMessageId };
}

/**
 * Adds a reaction to a message from user
 * @param token token of user doing the reacting
 * @param messageId message being reacted
 * @param reactId id of react e.g 1 = thumbUps
 * @returns empty object if successful
 */
export function messageReact(token: string, messageId: number, reactId: number): Record<string, never> {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  if (reactId !== 1) {
    throw HTTPError(400, 'invalid reactId');
  }
  const user = findUserWithToken(token);
  const { type, chatIndex, messageIndex } = getMessageLocation(messageId);
  if (!data[type][chatIndex].allMembers.includes(user.uId)) {
    throw HTTPError(400, 'user is not in dm/channel');
  }
  const message = data[type][chatIndex].messages[messageIndex];
  const reactIndex = message.reacts.findIndex(react => react.reactId === reactId);
  if (reactIndex === -1) {
    message.reacts.push(
      {
        reactId: reactId,
        uIds: [user.uId],
      }
    );
  } else if (message.reacts[reactIndex].uIds.includes(user.uId)) {
    throw HTTPError(400, 'already reacted with reactId');
  } else {
    message.reacts[reactIndex].uIds.push(user.uId);
  }
  let id: number;
  if (type === 'channels') {
    id = data[type][chatIndex].channelId;
  } else {
    id = data[type][chatIndex].dmId;
  }
  if (data[type][chatIndex].allMembers.includes(message.uId)) {
    const messageSenderHandle = data.users.find(user => user.uId === message.uId).handleStr;
    notificationSend(token, [messageSenderHandle], type, id, 'react');
  }
  return {};
}

/**
 * Removes a reaction from a message from user
 * @param token token of user removing react
 * @param messageId message being unreacted
 * @param reactId if of react
 * @returns empty object if successful
 */
export function messageUnreact(token: string, messageId: number, reactId: number): Record<string, never> {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  if (reactId !== 1) {
    throw HTTPError(400, 'invalid reactId');
  }
  const user = findUserWithToken(token);
  const { type, chatIndex, messageIndex } = getMessageLocation(messageId);
  if (!data[type][chatIndex].allMembers.includes(user.uId)) {
    throw HTTPError(400, 'user is not in dm/channel');
  }
  const message = data[type][chatIndex].messages[messageIndex];
  const reactIndex = message.reacts.findIndex(react => react.reactId === reactId);
  if (reactIndex === -1 || !message.reacts[reactIndex].uIds.includes(user.uId)) {
    throw HTTPError(400, 'user has not reacted with this reactId');
  }
  const uIdIndex = message.reacts[reactIndex].uIds.indexOf(user.uId);
  message.reacts[reactIndex].uIds.splice(uIdIndex, 1);
  return {};
}

/**
 * Puts a pin marker on a message
 * @param token token of user pinning a message
 * @param messageId message to be pinned
 * @returns empty object if successful
 */
export function messagePin(token: string, messageId: number): Record<string, never> {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  const user = findUserWithToken(token);
  const { type, chatIndex, messageIndex } = getMessageLocation(messageId);
  const chat = data[type][chatIndex];
  if (!chat.allMembers.includes(user.uId)) {
    throw HTTPError(400, 'user is not in dm/channel');
  }
  if (!hasMsgPermissions(user, chat, type)) {
    throw HTTPError(403, 'user is not owner');
  }
  if (chat.messages[messageIndex].isPinned === true) {
    throw HTTPError(400, 'message already pinned');
  }
  chat.messages[messageIndex].isPinned = true;
  return {};
}

export function messageUnpin(token: string, messageId: number): Record<string, never> {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  const user = findUserWithToken(token);
  const { type, chatIndex, messageIndex } = getMessageLocation(messageId);
  const chat = data[type][chatIndex];
  if (!chat.allMembers.includes(user.uId)) {
    throw HTTPError(400, 'user is not in dm/channel');
  }
  if (!hasMsgPermissions(user, chat, type)) {
    throw HTTPError(403, 'user is not owner');
  }
  if (chat.messages[messageIndex].isPinned === false) {
    throw HTTPError(400, 'message not pinned');
  }
  chat.messages[messageIndex].isPinned = false;
  return {};
}

/**
 * Sends a message to a channel in a specified time in the future
 * @param token token of user sending message
 * @param channelId  channelId of channel to send message into
 * @param message message contents
 * @param timeSent time to send message (unix timestamp in seconds)
 * @returns messageId of the to-be-sent message
 */
export function messageSendLater(token: string, channelId: number, message: string, timeSent: number): messageId {
  const currentTime = Math.floor((new Date()).getTime() / 1000);
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  if (!isValidCid(channelId)) {
    throw HTTPError(400, 'invalid channelId');
  }

  if (message.length < 1) {
    throw HTTPError(400, 'message length is less than 1');
  }

  if (message.length > 1000) {
    throw HTTPError(400, 'message length is greater than 1000');
  }

  if (timeSent < currentTime) {
    throw HTTPError(400, 'timeSent is in the past');
  }

  const user = findUserWithToken(token);
  if (!isMember(user.uId, channelId)) {
    throw HTTPError(403, 'user is not in channel');
  }

  const messageId = getMessageId();
  const length = timeSent - currentTime;
  setTimeout(function() {
    messageSendV1(token, channelId, message, messageId);
  }, length * 1000);
  return { messageId: messageId };
}

/**
 * Sends a message to a DM in a specified time in the future
 * @param token token of user sending message
 * @param dmId  dmId of DM to send message into
 * @param message message contents
 * @param timeSent time to send message (unix timestamp in seconds)
 * @returns messageId of the to-be-sent message
 */
export function messageSendLaterDm(token:string, dmId: number, message: string, timeSent: number): messageId {
  const currentTime = Math.floor((new Date()).getTime() / 1000);
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  if (!isValidDmId(dmId)) {
    throw HTTPError(400, 'invalid dmId');
  }

  if (message.length < 1) {
    throw HTTPError(400, 'message length is less than 1');
  }

  if (message.length > 1000) {
    throw HTTPError(400, 'message length is greater than 1000');
  }

  if (timeSent < currentTime) {
    throw HTTPError(400, 'timeSent is in the past');
  }

  const user = findUserWithToken(token);
  if (!isDmMember(user.uId, dmId)) {
    throw HTTPError(403, 'user is not in dm');
  }

  const messageId = getMessageId();
  const length = timeSent - currentTime;
  setTimeout(function() {
    messageSendDmV1(token, dmId, message, messageId);
  }, length * 1000);
  return { messageId: messageId };
}
