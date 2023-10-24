import { getData, setData } from './dataStore';
import { error } from './interface';
import { isValidUid, findUserWithToken, isValidToken } from './helper';
import HTTPError from 'http-errors';

/**
 * Allows a global owner to remove a user from Beans entirely
 * @param {string} token the token for the global owner removing someone
 * @param {number} uId the user ID of the person getting removed from Beans
 * @returns If no errors, an empty object. The person that the uId belongs to will be removed from the dataStore
 */
export function adminUserRemoveV1(token: string, uId: number): error | Record<string, never> { // NEEDS TO TEST A GO CAN REMOVE ANOTHER GO
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  if (!isValidUid(uId)) {
    throw HTTPError(400, 'invalid uId');
  }

  const data = getData();
  let ownerCounter = 0;
  let idIsGO = false;
  for (const user of data.users) {
    if (user.permissionId === 1) {
      ownerCounter++;
      if (uId === user.uId) {
        idIsGO = true;
      }
    }
  }
  if (ownerCounter <= 1 && idIsGO === true) {
    throw HTTPError(400, 'Cannot remove the only global owner');
  }
  if (findUserWithToken(token).permissionId === 2) {
    throw HTTPError(403, 'Only the global owner has permission');
  }
  for (const user of data.users) { // TOO EXTREME. It is accidentally removing everything
    if (uId === user.uId) {
      user.nameFirst = 'Removed';
      user.nameLast = 'user';
      user.handleStr = '';
      user.email = ''; // Not sure if this is correct but this should allow other people to use the same email
      user.isRemoved = true;
      user.tokens = [];
    }
  }

  for (const dm of data.dms) {
    for (const message of dm.messages) {
      if (uId === message.uId) {
        message.message = 'Removed user';
      }
    }
    if (dm.ownerMembers.includes(uId)) {
      dm.ownerMembers = dm.ownerMembers.filter(item => item !== uId);
    }
    if (dm.allMembers.includes(uId)) {
      dm.allMembers = dm.allMembers.filter(item => item !== uId);
    }
  }
  for (const channel of data.channels) {
    for (const message of channel.messages) {
      if (uId === message.uId) {
        message.message = 'Removed user';
      }
    }
    if (channel.ownerMembers.includes(uId)) {
      channel.ownerMembers = channel.ownerMembers.filter(item => item !== uId);
    }
    if (channel.allMembers.includes(uId)) {
      channel.allMembers = channel.allMembers.filter(item => item !== uId);
    }
  }
  setData(data);
  return {};
}

/**
 * Allows a global owner to make another user a global owner or global member
 * @param {string} token the token of a global owner
 * @param {number} uId the user ID of the person getting their permission ID changed
 * @param {number} permissionId the new ID level for the user either becoming a member (with an permission ID = 2) or an owner (with a permission ID = 1)
 * @returns If no errors occurred, an empty object. This should, however, change a user's permission ID in dataStore
 */
export function adminUserPermissionChangeV1(token: string, uId: number, permissionId: number): error | Record<string, never> {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  if (!isValidUid(uId)) {
    throw HTTPError(400, 'invalid uId');
  }

  if (permissionId !== 1 && permissionId !== 2) {
    throw HTTPError(400, 'invalid permissionId');
  }

  const tokenUser = findUserWithToken(token);
  const uIdUser = data.users.find(user => user.uId === uId);
  if (tokenUser.permissionId !== 1) {
    throw HTTPError(403, 'Must be a global owner to use this function');
  }

  let globalOwnCounter = 0;
  for (const user of data.users) {
    if (user.permissionId === 1) {
      globalOwnCounter++;
    }
  }

  if (uIdUser.permissionId === 1 && globalOwnCounter === 1 && permissionId === 2) {
    throw HTTPError(400, 'Cannot change permission of the only global owner');
  }

  if (uIdUser.permissionId === permissionId) {
    throw HTTPError(400, 'User already has that permissionId');
  }

  uIdUser.permissionId = permissionId;
  setData(data);
  return {};
}
