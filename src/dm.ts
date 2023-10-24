import { getData, setData } from './dataStore';
import { findUserWithToken, isDmMember, isValidDmId, isValidToken, isValidUid, isDmOwner, createOutputMessages } from './helper';
import { error, dmId, dmsList, dmDetail, messages, profile } from './interface';
import { userProfileV1 } from './users';
import HTTPError from 'http-errors';
import { notificationSend } from './notifications';
import { addUserDmStat, addWorkspaceDmsStat, addWorkspaceMessagesStat } from './stats';

/**
 * Creates a DM
 * @param {string} token token of DM owner
 * @param {number[]} uIds array of member uIds, excluding owner's uId
 * @returns {{ dmId: number }} object containg ID of created DM
 */
export function dmCreateV1(token: string, uIds: number[]): dmId | error {
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  const uIdSet = new Set(uIds);
  if (uIdSet.size !== uIds.length) {
    throw HTTPError(400, 'duplicate uIds given');
  }

  for (const uId of uIds) {
    if (isValidUid(uId) === false) {
      throw HTTPError(400, 'invalid uId');
    }
  }

  const data = getData();
  const handles: string[] = [];
  for (const uId of uIds) {
    handles.push(data.users.find(user => user.uId === uId).handleStr);
  }
  const notificationHandles = Array(...handles);
  const ownerId = findUserWithToken(token).uId;

  handles.push(data.users.find(user => user.uId === ownerId).handleStr);
  handles.sort();

  let dmName = handles[0];
  for (let i = 1; i < handles.length; i++) {
    dmName = dmName.concat(', ', handles[i]);
  }

  let dmId: number;
  if (data.dms.length === 0) {
    dmId = 0;
  } else {
    dmId = data.dms[data.dms.length - 1].dmId + 1;
  }

  uIds.push(ownerId);

  data.dms.push(
    {
      dmId: dmId,
      name: dmName,
      creator: ownerId,
      ownerMembers: [ownerId],
      allMembers: uIds,
      messages: []
    }
  );
  notificationSend(token, notificationHandles, 'dms', dmId, 'add');
  for (const uId of uIds) {
    addUserDmStat(uId, 'join');
  }
  addWorkspaceDmsStat('increase');
  setData(data);
  return { dmId };
}

/**
 * returns a list of the user's dms
 * @param token token of user requesting list of their dms
 * @returns object containing a list of user's dms
 */
export function dmListV1(token: string): dmsList | error {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  const user = findUserWithToken(token);
  const dmsList: dmsList = {
    dms: []
  };
  for (const dm of data.dms) {
    if (dm.allMembers.includes(user.uId)) {
      dmsList.dms.push(
        {
          dmId: dm.dmId,
          name: dm.name,
        }
      );
    }
  }
  return dmsList;
}

/**
 * Deletes dm that user is a part of
 * @param token user requesting to delete the dm
 * @param dmId id of the dm to be deleted
 * @returns empty object if dm is successfully deleted
 */
export function dmRemoveV1(token: string, dmId: number) {
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  if (!isValidDmId(dmId)) {
    throw HTTPError(400, 'invalid dmId');
  }

  const user = findUserWithToken(token);
  const uId = user.uId;
  if (!isDmMember(uId, dmId)) {
    throw HTTPError(403, 'token is not in DM');
  }

  const data = getData();
  if (data.dms.find(dm => dm.dmId === dmId).creator !== uId) {
    throw HTTPError(403, 'token is not the original creator');
  }
  const dm = data.dms.find(dm => dm.dmId === dmId);
  for (const uId of dm.allMembers) {
    addUserDmStat(uId, 'leave');
  }
  for (let i = 0; i < dm.messages.length; i++) {
    addWorkspaceMessagesStat('decrease');
  }
  data.dms = data.dms.filter(dm => dm.dmId !== dmId);
  addWorkspaceDmsStat('decrease');
  setData(data);
  return {};
}
/**
 *  Returns dm details
 * @param token token of user trying to get dm details
 * @param dmId id of dm
 * @returns details of dm if user is a member
 */
export function dmDetailsV1(token: string, dmId: number): dmDetail | error {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  if (!isValidDmId(dmId)) {
    throw HTTPError(400, 'invalid dmId');
  }
  if (!isDmMember(findUserWithToken(token).uId, dmId)) {
    throw HTTPError(403, 'user is not a member of dm');
  }

  const dm = data.dms.find(dm => dm.dmId === dmId);
  const dmDetail: dmDetail = {
    name: dm.name,
    members: [],
  };

  for (const id of dm.allMembers) {
    dmDetail.members.push((userProfileV1(token, id) as profile).user);
  }
  return dmDetail;
}

/**
 * Removes a user from a DM
 * @param {string} token token of member trying to leave
 * @param {number} dmId id of DM
 * @returns {} empty object
 */
export function dmLeaveV1(token: string, dmId: number) {
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  if (!isValidDmId(dmId)) {
    throw HTTPError(400, 'invalid dmId');
  }

  const uId = findUserWithToken(token).uId;
  if (!isDmMember(uId, dmId)) {
    throw HTTPError(403, 'member is not in DM');
  }

  const data = getData();
  const dmIndex = data.dms.findIndex(dm => dm.dmId === dmId);
  if (isDmOwner(uId, dmId)) {
    data.dms[dmIndex].ownerMembers = []; // dm.ownerMembers will only contain 1 DM owner as of now, and there is no other way to add owners
  }
  const uIdIndex = data.dms[dmIndex].allMembers.indexOf(uId);
  data.dms[dmIndex].allMembers.splice(uIdIndex, 1);
  addUserDmStat(uId, 'leave');
  setData(data);

  return {};
}

/**
 * Returns up to 50 messages
 * @param token token of user requesting to get message info
 * @param dmId id of dm being looked at to get message info
 * @param start index of message to start looking
 * @returns object containing start and end and max 50 messages
 */
export function dmMessagesV1(token: string, dmId: number, start: number): messages | error {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  if (!isValidDmId(dmId)) {
    throw HTTPError(400, 'invalid dmId');
  }
  if (!isDmMember(findUserWithToken(token).uId, dmId)) {
    throw HTTPError(403, 'user is not a member');
  }

  const dm = data.dms.find(dm => dm.dmId === dmId);

  if (start > dm.messages.length) {
    throw HTTPError(400, 'start is greater than total messages');
  }

  let end = start + 50;
  if (start + 50 >= dm.messages.length) {
    end = -1;
  }
  const messages = dm.messages.slice(start, start + 50);
  return {
    messages: createOutputMessages(token, messages),
    start: start,
    end: end,
  };
}
