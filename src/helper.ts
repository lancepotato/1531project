import { getData, setData } from './dataStore';
import { channel, dm, MessageLocation, message, OutputReact, React, user, OutputMessage } from './interface';
import HTTPError from 'http-errors';
import crypto from 'crypto';

/**
 * Checks if user with id exists
 * @param Id authUserId or uId
 * @returns boolean value whether id is valid
 */
export function isValidUid(Id: number): boolean {
  const data = getData();
  return (data.users.some(user => user.uId === Id));
}

/**
 * Checks if user with id exists
 * @param Id channelId
 * @returns boolean value whether id is valid
 */
export function isValidCid(Id: number): boolean {
  const data = getData();
  return (data.channels.some(user => user.channelId === Id));
}

/**
 * Checks whether uId is a member of channel
 * @param uId id of user being checked
 * @param channelId channel being checked
 * @returns boolean value whether uId is a member of channel
 */
export function isMember(uId: number, channelId: number): boolean {
  const data = getData();
  const channel = data.channels.find(channel => channel.channelId === channelId);
  return (channel.allMembers.includes(uId));
}

/**
 * Checks whether uId is an owner of channel
 * @param uId id of user being checked
 * @param channelId channel being checked
 * @returns boolean value whether uId is a owner of channel
 */
export function isOwner(uId: number, channelId: number): boolean {
  const data = getData();
  const channel = data.channels.find(channel => channel.channelId === channelId);
  return (channel.ownerMembers.includes(uId));
}

/**
 * Checks whether token exists
 * @param token token being checked
 * @returns boolean value whether token exists
 */
export function isValidToken(token: string): boolean {
  const data = getData();
  for (const user of data.users) {
    for (const userToken of user.tokens) {
      if (getHashOfToken(userToken) === token) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Finds user with the token
 * (note that this function should be used after using isValidToken, guaranteeing that a user will be found)
 * @param token taken being checked
 * @returns user with the token (the actual object reference in dataStore)
*/
export function findUserWithToken(token: string): user {
  const data = getData();
  for (const user of data.users) {
    for (const userToken of user.tokens) {
      if (getHashOfToken(userToken) === token) {
        return user;
      }
    }
  }
}

/**
 * Checks if dm with id exists
 * @param Id dmId
 * @returns boolean value whether id is valid
 */
export function isValidDmId(Id: number): boolean {
  const data = getData();
  return (data.dms.some(dm => dm.dmId === Id));
}
/**
 * Checks whether uId is the owner of dm
 * @param uId id of user being checked
 * @param dmId id of dm being checked
 * @returns boolean value whether uid is the owner
 */
export function isDmOwner(uId: number, dmId: number): boolean {
  const data = getData();
  const dm = data.dms.find(dm => dm.dmId === dmId);
  return (dm.ownerMembers.includes(uId));
}

/**
 * Checks whether uId is a member of dm
 * @param uId id of user being checked
 * @param dmId id of dm being checked
 * @returns boolean value whether uid is a member
 */
export function isDmMember(uId: number, dmId: number): boolean {
  const data = getData();
  const dm = data.dms.find(dm => dm.dmId === dmId);
  return (dm.allMembers.includes(uId));
}

/**
 * Generates new messageId
 * @returns new messageId
 */
export function getMessageId(): number {
  const data = getData();
  const messageId = data.messageCounter;
  data.messageCounter++;
  setData(data);
  return messageId;
}

/**
 * Checks whether user has permissions to edit or remove the msg
 * @param user object of user trying to edit or remove the msg
 * @param senderId msg's original sender
 * @param chat dm or channel object
 * @param chatType dm or channel type
 * @returns boolean value whether user has permissions
 */
export function hasMsgPermissions (user: user, chat: (dm | channel), chatType: string, senderId?: number): boolean {
  if (chatType === 'channels') {
    return (user.permissionId === 1 || chat.ownerMembers.includes(user.uId) || senderId === user.uId);
  }
  if (chatType === 'dms') {
    return (chat.ownerMembers.includes(user.uId) || senderId === user.uId);
  }
}

/**
 * Gets chatType, chatIndex and messageIndex to determine where message is in data
 * @param messageId id of message being located
 * @returns objects with chatType, chatIndex and messageIndex
 */
export function getMessageLocation(messageId: number): MessageLocation {
  const data = getData();
  let type: ('dms' | 'channels');
  if (data.channels.some(channel => channel.messages.some(msg => msg.messageId === messageId))) {
    type = 'channels';
  } else if (data.dms.some(dm => dm.messages.some(msg => msg.messageId === messageId))) {
    type = 'dms';
  } else {
    throw HTTPError(400, 'invalid messageId');
  }

  const chatIndex = data[type].findIndex((chat: (channel | dm)) => chat.messages.some(msg => msg.messageId === messageId));
  const messageIndex = data[type][chatIndex].messages.findIndex((msg: message) => msg.messageId === messageId);
  return {
    type: type,
    chatIndex: chatIndex,
    messageIndex: messageIndex,
  };
}

/**
 * Finds a user from their handleString
 * @param handleStr the handleString of user being found
 * @returns user object
 */
export function findUserWithHandle(handleStr: string): user {
  const data = getData();
  return (data.users.find(user => user.handleStr === handleStr));
}

/**
 * Checks whether user with handleString exists
 * @param handleStr the handleString being checked
 * @returns boolean value whether handleString exists
 */
export function isValidHandleStr(handleStr: string) {
  const data = getData();
  return data.users.some(user => user.handleStr === handleStr);
}

/**
 * Creates reacts output based on spec (with isThisUserReacted)
 * @param token token of user requesting react data
 * @param reacts array of reacts on message
 * @returns react array with isThisUserReacted
 */
export function createOutputReacts(token: string, reacts: React[]): OutputReact[] {
  const user = findUserWithToken(token);
  const OutputReacts = [];
  for (const react of reacts) {
    OutputReacts.push(
      {
        reactId: react.reactId,
        uIds: react.uIds,
        isThisUserReacted: react.uIds.includes(user.uId),
      }
    );
  }
  return OutputReacts;
}

/**
 * creates messages output based on spec (with changes to reacts)
 * @param token token of user requesting message data
 * @param messages array of messages
 * @returns messages array with changes to reacts
 */
export function createOutputMessages(token: string, messages: message[]): OutputMessage[] {
  const outputMessage: OutputMessage[] = [];
  for (const message of messages) {
    outputMessage.push(
      {
        messageId: message.messageId,
        uId: message.uId,
        message: message.message,
        timeSent: message.timeSent,
        reacts: createOutputReacts(token, message.reacts),
        isPinned: message.isPinned,
      }
    );
  }
  return outputMessage;
}

/**
 * Creates a hash of the given string.
 * @param plaintext string to be hashed (token/password)
 * @returns hashed version of the given string
   */
export function getHashOf(plaintext: string) {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

/**
 * Creates a hash from a given a string and a secret string (for tokens)
 * @param token token to be hashed
 * @returns hashed version of the token (+ secret)
 */
export function getHashOfToken(token: string) {
  const secret = 'AerrorPlane';
  return getHashOf(token + secret);
}

/**
 * given a message, shares the message to the target channel/dm
 * @param channelId -1 if sharing to DM
 * @param dmId -1 if sharing to channel
 * @param sharedMessageId id of the message that will be created in the target channel/dm
 * @param sharedMessage string contents of the message
 * @param user user who is sharing the message
 */
export function shareMessageToChat(channelId: number, dmId: number, sharedMessageId: number, sharedMessage: string, user: user) {
  const data = getData();
  const timeSent = Math.floor((new Date()).getTime() / 1000);
  if (channelId === -1) {
    const dm = data.dms.find(dm => dm.dmId === dmId);
    if (!isDmMember(user.uId, dm.dmId)) {
      throw HTTPError(403, 'user is not in target channel/dm');
    }
    dm.messages.unshift(
      {
        messageId: sharedMessageId,
        uId: user.uId,
        message: sharedMessage,
        timeSent: timeSent,
        reacts: [],
        isPinned: false
      }
    );
    setData(data);
  } else if (dmId === -1) {
    const channel = data.channels.find(channel => channel.channelId === channelId);
    if (!isMember(user.uId, channelId)) {
      throw HTTPError(403, 'user is not in target channel/dm');
    }
    channel.messages.unshift(
      {
        messageId: sharedMessageId,
        uId: user.uId,
        message: sharedMessage,
        timeSent: timeSent,
        reacts: [],
        isPinned: false
      }
    );
    setData(data);
  }
}

/**
 * Calculates a user's involvement rate
 * @param user the user being checked
 * @returns the user's involvement rate
 */
export function generateInvolvementRate(user: user): number {
  const data = getData();
  const numChannelsJoined = user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1].numChannelsJoined;
  const numDmsJoined = user.userStats.dmsJoined[user.userStats.dmsJoined.length - 1].numDmsJoined;
  const numMessagesSent = user.userStats.messagesSent[user.userStats.messagesSent.length - 1].numMessagesSent;
  const numChannels = data.workspaceStats.channelsExist[data.workspaceStats.channelsExist.length - 1].numChannelsExist;
  const numDms = data.workspaceStats.dmsExist[data.workspaceStats.dmsExist.length - 1].numDmsExist;
  const numMsgs = data.workspaceStats.messagesExist[data.workspaceStats.messagesExist.length - 1].numMessagesExist;
  const numerator = numChannelsJoined + numDmsJoined + numMessagesSent;
  const denominator = numChannels + numDms + numMsgs;
  if (denominator === 0) {
    return 0;
  }
  return Math.min((numerator / denominator), 1);
}

/**
 * Get the current time in seconds
 * @returns the current time in seconds
 */
export function getTimeStamp(): number {
  const timeStamp = Math.floor((new Date()).getTime() / 1000);
  return timeStamp;
}

/**
 * Calculates utilization rate of workspace
 * @returns the workspaces's utilization rate
 */
export function generateUtilizationRate() {
  const data = getData();
  let usersInAtLeastOneChannelOrDm = 0;
  const numUsers = data.users.filter(user => user.isRemoved === false).length;
  for (const user of data.users) {
    if (isUserInAtLeastOneDm(user) || isUserInAtLeastOneChannel(user)) {
      usersInAtLeastOneChannelOrDm++;
    }
  }
  return (usersInAtLeastOneChannelOrDm / numUsers);
}

/**
 * Determines whether user has joined at least one channel
 * @param user user being checked
 * @returns boolean value whether user has joined at least one channel
 */
export function isUserInAtLeastOneChannel(user: user): boolean {
  return (user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1].numChannelsJoined > 0 && user.isRemoved === false);
}

/**
 * Determines whether user has joined at least one dm
 * @param user user being checked
 * @returns boolean value whether user has joined at least one dm
 */
export function isUserInAtLeastOneDm(user: user): boolean {
  return (user.userStats.dmsJoined[user.userStats.dmsJoined.length - 1].numDmsJoined > 0 && user.isRemoved === false);
}
