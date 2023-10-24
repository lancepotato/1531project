import { getData, setData } from './dataStore';
import { findUserWithToken, isMember, isValidToken, getMessageId, isValidCid } from './helper';
import { message, user } from './interface';
import HTTPError from 'http-errors';
import { addUserMessageStat, addWorkspaceMessagesStat } from './stats';

/**
 * standupStartV1
 * Creates a standup period for a given time
 *
 * Arguments:
 *   token - user identifier
 *   channelId - channel that needs a standup
 *   length - duration of standup in seconds
 * Return Value:
 *   400 error - any error
 *   403 error - invalid token and authUserID not member of channel
 *   finishTime - Successful case
 */
export function standupStartV1 (token: string, channelId: number, length: number) {
  const data = getData();

  // Error checking

  // Validate token
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  // length is a negative integer
  if (length < 0) {
    throw HTTPError(400, 'Length is a negative integer');
  }

  // Invalid channelID
  if (isValidCid(channelId) === false) {
    throw HTTPError(400, 'invalid channelId');
  }

  const user: user = findUserWithToken(token);

  // Invalid authUser
  if (!isMember(user.uId, channelId)) {
    throw HTTPError(403, 'User is not a member of channel');
  }

  const channel = data.channels.find(channel => channel.channelId === channelId);

  // Active standup currently running in the channel
  if (channel.standupActive.isStandupActive) {
    throw HTTPError(400, 'active standup already running in channel');
  }

  const finishTime: number = Math.floor((new Date()).getTime() / 1000) + length;

  const index: number = data.channels.indexOf(channel);
  data.channels[index].standupActive.isStandupActive = true;
  data.channels[index].standupActive.timeStandupFinish = finishTime;
  data.channels[index].standupActive.user = user.uId;
  setData(data);
  setTimeout(function() { standupFinish(channel.channelId, user); }, length * 1000);
  return { finishTime: finishTime };
}

// Helper function which is called after standup finishes after given duration
// Sends messages to channel
function standupFinish(channelId: number, user: user) {
  const data = getData();
  const channel = data.channels.find(channel => channel.channelId === channelId);
  let finalOutput = '';

  if (channel.standupMessage.length !== 0) {
    for (let i = 0; i < channel.standupMessage.length - 1; i++) {
      finalOutput += (channel.standupMessage[i] + '\n');
    }
    finalOutput += channel.standupMessage[(channel.standupMessage.length) - 1];
  } else {
    const index: number = data.channels.indexOf(channel);
    data.channels[index].standupActive.isStandupActive = false;
    data.channels[index].standupMessage = [];
    delete data.channels[index].standupActive.timeStandupFinish;
    delete data.channels[index].standupActive.user;
    return;
  }

  const newId = getMessageId();
  const newMessage: message = {
    messageId: newId,
    uId: user.uId,
    timeSent: Math.floor(Date.now() / 1000),
    message: finalOutput,
    isPinned: false,
    reacts: [],
  };

  const index: number = data.channels.indexOf(channel);
  addUserMessageStat(data.channels[index].standupActive.user);
  addWorkspaceMessagesStat('increase');
  data.channels[index].messages.unshift(newMessage);
  data.channels[index].standupActive.isStandupActive = false;
  data.channels[index].standupMessage = [];
  delete data.channels[index].standupActive.timeStandupFinish;
  delete data.channels[index].standupActive.user;
  setData(data);
  return {};
}

/**
 * standupSendV1
 * Sends message to buffered in standup queue
 *
 * Arguments:
 *   token - user identifier
 *   channelId - channel that needs a standup
 *   message - message to be sent
 * Return Value:
 *   400 error - any error
 *   403 error - invalid token and authUserID not member of channel
 *   finishTime - Successful case
 */
export function standupSendV1 (token: string, channelId: number, message: string) {
  const data = getData();

  // Error checking

  // Validate token
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  // Message is over 1000 chars
  if (message.length > 1000) {
    throw HTTPError(400, 'Message is over 1000 chars');
  }

  // Invalid channelID
  if (isValidCid(channelId) === false) {
    throw HTTPError(400, 'invalid channelId');
  }

  // Invalid authUser
  if (!isMember(findUserWithToken(token).uId, channelId)) {
    throw HTTPError(403, 'User is not a member of channel');
  }

  const channel = data.channels.find(channel => channel.channelId === channelId);

  // No active standup
  if (!(channel.standupActive.isStandupActive)) {
    throw HTTPError(400, 'No active standup');
  }

  const user: user = findUserWithToken(token);

  const index: number = data.channels.indexOf(channel);
  const outputStr: string = (user.handleStr + ': ' + message);
  data.channels[index].standupMessage.push(outputStr);
  setData(data);
  return {};
}

/**
 * standupActiveV1
 * Returns whether standup is active or not
 *
 * Arguments:
 *   token - user identifier
 *   channelId - channel that needs a standup
 * Return Value:
 *   400 error - any error
 *   403 error - invalid token and authUserID not member of channel
 *   { isActive, timeFinish} - boolean whether standup is active or not, timeFinish - null if no standup active
 */
export function standupActiveV1 (token: string, channelId: number) {
  const data = getData();

  // Error checking

  // Validate token
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  // Invalid channelID
  if (isValidCid(channelId) === false) {
    throw HTTPError(400, 'invalid channelId');
  }

  const user: user = findUserWithToken(token);

  // Invalid authUser
  if (!isMember(user.uId, channelId)) {
    throw HTTPError(403, 'User is not a member of channel');
  }

  const channel = data.channels.find(channel => channel.channelId === channelId);

  if (channel.standupActive.isStandupActive) {
    return { isActive: channel.standupActive.isStandupActive, timeFinish: channel.standupActive.timeStandupFinish };
  } else {
    // eslint-disable-next-line
    // @ts-ignore
    return { isActive: false, timeFinish: null };
  }
}
