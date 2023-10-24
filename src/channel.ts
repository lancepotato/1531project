import { getData, setData } from './dataStore';
import { createOutputMessages, findUserWithToken, isMember, isValidCid, isValidToken } from './helper';
import { channel, channelDetails, error, messages, profile, user } from './interface';
import { userProfileV1 } from './users';
import HTTPError from 'http-errors';
import { notificationSend } from './notifications';
import { addUserChannelStat } from './stats';

/**
 * To obtain channel details given token and channelId
 * @param {string} token token of user that is logged in
 * @param {num} channelId channel Id that user is trying to view
 * @returns object of channel details if token and channelId are valid
 */

function channelDetailsV1 (token: string, channelId: number): channelDetails | error {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'token is invalid');
  }
  if (!isValidCid(channelId)) {
    throw HTTPError(400, 'channelId is invalid');
  }
  if (!isMember(findUserWithToken(token).uId, channelId)) {
    throw HTTPError(403, 'User is not a member of channel');
  }

  const channel = data.channels.find(channel => channel.channelId === channelId);
  const channelDetails: channelDetails = {
    name: channel.name,
    isPublic: channel.isPublic,
    ownerMembers: [],
    allMembers: []
  };

  for (const id of channel.ownerMembers) {
    channelDetails.ownerMembers.push((userProfileV1(token, id) as profile).user);
  }
  for (const id of channel.allMembers) {
    channelDetails.allMembers.push((userProfileV1(token, id) as profile).user);
  }
  return channelDetails;
}

/**
 * Adds user as a member to the channel given token and channelId
 * @param {string} token token of user that is logged in
 * @param {num} channelId  channel Id that user is trying to join
 * @returns empty object when token and channelId are valid
 */
function channelJoinV1 (token: string, channelId: number): error | Record<string, never> {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'token is invalid');
  }
  if (!isValidCid(channelId)) {
    throw HTTPError(400, 'channelId is invalid');
  }
  if (isMember(findUserWithToken(token).uId, channelId)) {
    throw HTTPError(400, 'User is already a member');
  }

  const user = findUserWithToken(token);
  const index = data.channels.findIndex(channel => channel.channelId === channelId);
  if (data.channels[index].isPublic === false && user.permissionId === 2) {
    throw HTTPError(403, 'channel is private and user is not global owner');
  }
  data.channels[index].allMembers.push(user.uId);
  addUserChannelStat(user.uId, 'join');
  setData(data);
  return {};
}

/**
* channelInviteV3
* allows user to join a channel by being invited by an existing member (authUser)
*
* Arguments:
*   authUserId: integer - user that invites an another user
*   channelId - channel that uid will join
*   uId - joining member uid
*
* Return Value:
*   403 error  - authUser not member or token invalid
*   400 error  - any other error
*   {} - empty object   Successful case
*/
function channelInviteV3 (token: string, channelId: number, uId: number): error | Record<string, never> {
  const data = getData();

  // Validate token
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  // Find Channel
  let channelCount: number;
  let channelMatch: channel;
  const channelsData = data.channels;
  for (let i = 0; i < channelsData.length; i++) {
    if (channelId === channelsData[i].channelId) {
      channelMatch = channelsData[i];
      channelCount = i;
    }
  }

  // Invalid channel
  if (channelMatch === undefined) {
    throw HTTPError(400, 'invalid channelid');
  }

  // Find user
  let user: user;
  const usersData = data.users;
  for (let i = 0; i < usersData.length; i++) {
    if (uId === usersData[i].uId) {
      user = usersData[i];
    }
  }

  // Invalid user
  if (user === undefined) {
    throw HTTPError(400, 'invalid userid');
  }

  // User in channel already
  for (const userChannels of channelMatch.allMembers) {
    if (uId === userChannels) {
      throw HTTPError(400, 'user already in channel');
    }
  }

  const ownerId = findUserWithToken(token).uId;

  // AuthId not in channel
  if (!channelMatch.allMembers.includes(ownerId)) {
    throw HTTPError(403, 'token not a member');
  }

  // Push and set data to arrays
  data.channels[channelCount].allMembers.push(user.uId);
  const invitedUserHandle = data.users.find(user => user.uId === uId).handleStr;
  notificationSend(token, [invitedUserHandle], 'channels', channelId, 'add');
  addUserChannelStat(uId, 'join');
  setData(data);
  return {};
}

/**
 * channelMessagesV3
 * Returns up to 50 of user's most recent messages in given channel
 * and a specified range.
 *
 * Arguments:
 *      authUserId: integer     The user's unique identifier
 *      channelId:  integer     The channel's unique identifier
 *      start:      integer     The left-bound of range
 *
 * Returns:
 *      403 error  - authUser not member or token invalid
 *      400 error  - any other error
 *      object      - Object returned in successful case
 */
function channelMessagesV3(token: string, channelId: number, start: number): messages | error {
  const data = getData();

  // Error Checking:

  // Validate token
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  const TargetChannel = data.channels.find(channel => channel.channelId === channelId);

  // Invalid channelID
  if (TargetChannel === undefined) {
    throw HTTPError(400, 'invalid channelid');
  }

  if (!isMember(findUserWithToken(token).uId, channelId)) {
    throw HTTPError(403, 'User is not a member of channel');
  }
  // If start is bigger than messages
  if (start > TargetChannel.messages.length) {
    throw HTTPError(400, 'start greater than total messages');
  }

  // If no more messages
  let end: number;
  if (start + 50 >= TargetChannel.messages.length) {
    end = -1;
  } else {
    end = start + 50;
  }

  // Function return object:
  const messages = TargetChannel.messages.slice(start, start + 50);
  const object = {
    messages: createOutputMessages(token, messages),
    start: start,
    end: end,
  };

  setData(data);
  return object;
}

/**
* removeChannelOwnerV2
* Remove user as channel owner
*
* Arguments:
*   token: string - the user removing the the owner
*   channelId: number -  channel
*   uId: number - user that will be removed as owner
*
* Return Value:
*   403 error  - authUser not member or token invalid
*   400 error  - any other error
*   {}         - Successful case
*/
function channelRemoveOwnerV2(token: string, channelId: number, uId: number): error | Record<string, never> {
  const data = getData();
  // Error Checking

  // Validate token
  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const authUserId = findUserWithToken(token).uId;
  const channel = data.channels.find(channel => channel.channelId === channelId);
  const authID = data.users[data.users.findIndex(user => user.uId === authUserId)];
  const uIdPosition = data.users.findIndex(user => user.uId === uId);
  const uIds = data.users[uIdPosition];

  // Invalid channelId
  if (channel === undefined) {
    throw HTTPError(400, 'Invalid channelId');
  }

  // Invaid User
  if (uIds === undefined) {
    throw HTTPError(400, 'Invalid uId');
  }

  //  uId not owner
  if (!channel.ownerMembers.includes(uId)) {
    throw HTTPError(400, 'uId not owner');
  }

  // User removing channel owner is not global and/or channel owner
  if (authID.permissionId !== 1 && !channel.ownerMembers.includes(authID.uId)) {
    throw HTTPError(403, 'No owner permissions');
  }

  // Only one owner
  if (channel.ownerMembers.length === 1) {
    throw HTTPError(400, 'Only one owner');
  }

  // Removing Owner if no errors

  const position = data.channels.indexOf(channel);
  data.channels[position].ownerMembers.splice(data.channels[position].ownerMembers.indexOf(uId), 1);

  setData(data);
  return {};
}

/**
* channelAddOwnerV2
* Adduser as channel owner
*
* Arguments:
*   token: string - identifier of authUserId
*   channelId: numner - the channel where user will become owner
*   uId: number - user to be added as an owner
*
* Return Value:
*    403 error  - authUser not member or token invalid
*    400 error  - any other error
*    {}          - Successful case
*/
function channelAddOwnerV2(token: string, channelId: number, uId: number): error | Record<string, never> {
  const data = getData();

  // Error Checking

  // Validate token
  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const authUserId = findUserWithToken(token).uId;
  const channel = data.channels.find(channel => channel.channelId === channelId);
  const authID = data.users[data.users.findIndex(user => user.uId === authUserId)];
  const uIdPosition = data.users.findIndex(user => user.uId === uId);
  const uIds = data.users[uIdPosition];

  // Invalid User
  if (uIds === undefined) {
    throw HTTPError(400, 'Invalid uId');
  }

  // Invalid channelId
  if (channel === undefined) {
    throw HTTPError(400, 'Invalid channelId');
  }

  // error when the user is already a channel owner
  if (channel.ownerMembers.includes(uId)) {
    throw HTTPError(400, 'User already owner');
  }

  // user not a member of channel
  if (!isMember(uId, channelId)) {
    throw HTTPError(400, 'User is not a member of channel');
  }

  // authUser not an global or channel owner
  if (!(channel.ownerMembers.includes(authID.uId)) && (authID.permissionId !== 1)) {
    throw HTTPError(403, 'No owner permissions');
  }

  // Adding Owner if no errors

  data.channels[data.channels.indexOf(channel)].ownerMembers.push(uId);

  setData(data);
  return {};
}

/**
* channelLeaveV2
* Function so user can leave a channel.
*
* Arguments:
*   token - string
*   channelId - number - the channel user wants to join
*
* Return Value:
*   403 error  - authUser not member or token invalid
*   400 error  - any other error
*   {}         - Successful case
*/
function channelLeaveV2(token:string, channelId: number): error | Record<string, never> {
  const data = getData();

  // Invalid Token
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  const TargetChannel = data.channels.find(channel => channel.channelId === channelId);

  // Invalid channelID
  if (TargetChannel === undefined) {
    throw HTTPError(400, 'invalid channelId');
  }

  // Invalid authUser
  if (!isMember(findUserWithToken(token).uId, channelId)) {
    throw HTTPError(403, 'User is not a member of channel');
  }

  // AuthUser starter of active standup
  if (TargetChannel.standupActive.user === findUserWithToken(token).uId) {
    throw HTTPError(400, 'AuthUser starter of active standup');
  }

  const targetChannelIndex = data.channels.findIndex(channel => channel.channelId === channelId);

  // Find user/owner to leave channel
  addUserChannelStat(findUserWithToken(token).uId, 'leave');
  for (let j = 0; j < TargetChannel.allMembers.length; j++) {
    if (TargetChannel.ownerMembers[j] === findUserWithToken(token).uId) {
      const newList = TargetChannel.ownerMembers.filter(item => item !== findUserWithToken(token).uId);
      TargetChannel.ownerMembers = newList;
      data.channels[targetChannelIndex] = TargetChannel;
      setData(data);
    }
    if (TargetChannel.allMembers[j] === findUserWithToken(token).uId) {
      const newList = TargetChannel.allMembers.filter(item => item !== findUserWithToken(token).uId);
      TargetChannel.allMembers = newList;
      data.channels[targetChannelIndex] = TargetChannel;
      setData(data);
      return {};
    }
  }
}

export { channelDetailsV1, channelJoinV1, channelInviteV3, channelMessagesV3, channelLeaveV2, channelRemoveOwnerV2, channelAddOwnerV2 };
