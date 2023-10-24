import request, { HttpVerb } from 'sync-request';

import { port, url } from '../config.json';
const SERVER_URL = `${url}:${port}`;

/**
 * HTTP wrapper for calling functions in tests
 * @param {HttpVerb} method HTTP method ('GET', 'POST', 'PUT', 'DELETE')
 * @param {string} path HTTP route/path of the function
 * @param {object} payload qs/json object for request
 * @param {object} headers (optional) header for passing in token
 * @returns response from HTTP server
 */
function requestHelper(method: HttpVerb, path: string, payload: object, headers = {}) {
  let qs = {};
  let json = {};
  if (['GET', 'DELETE'].includes(method)) {
    qs = payload;
  } else {
    // PUT/POST
    json = payload;
  }
  const res = request(method, SERVER_URL + path, { qs, json, headers });
  if (res.statusCode !== 200) {
    return {
      code: res.statusCode,
      error: JSON.parse(res.body as string).error.message
    };
  }
  return JSON.parse(res.getBody() as string);
}

export function authLoginV3(email: string, password: string) {
  return requestHelper('POST', '/auth/login/v3', { email, password });
}

export function authRegisterV3(email: string, password: string, nameFirst: string, nameLast: string) {
  return requestHelper('POST', '/auth/register/v3', { email, password, nameFirst, nameLast });
}

export function channelsCreateV2(token: string, name: string, isPublic: boolean) {
  return requestHelper('POST', '/channels/create/v3', { name, isPublic }, { token });
}

export function channelsListV2(token: string) {
  return requestHelper('GET', '/channels/list/v3', {}, { token });
}

export function channelsListAllV2(token: string) {
  return requestHelper('GET', '/channels/listall/v3', {}, { token });
}

export function channelDetailsV2(token: string, channelId: number) {
  return requestHelper('GET', '/channel/details/v3', { channelId }, { token });
}

export function channelJoinV2(token: string, channelId: number) {
  return requestHelper('POST', '/channel/join/v3', { channelId }, { token });
}

export function channelInviteV2(token: string, channelId: number, uId: number) {
  return requestHelper('POST', '/channel/invite/v3', { channelId, uId }, { token });
}

export function channelMessagesV2(token: string, channelId: number, start: number) {
  return requestHelper('GET', '/channel/messages/v3', { channelId, start }, { token });
}

export function userProfileV2(token: string, uId: number) {
  return requestHelper('GET', '/user/profile/v3', { uId }, { token });
}

export function clearV1() {
  return requestHelper('DELETE', '/clear/v1', {});
}

export function authLogoutV2(token: string) {
  return requestHelper('POST', '/auth/logout/v2', {}, { token });
}

export function channelLeaveV1(token: string, channelId: number) {
  return requestHelper('POST', '/channel/leave/v2', { channelId }, { token });
}

export function channelAddOwnerV1(token: string, channelId: number, uId: number) {
  return requestHelper('POST', '/channel/addowner/v2', { channelId, uId }, { token });
}

export function channelRemoveOwnerV1(token: string, channelId: number, uId: number) {
  return requestHelper('POST', '/channel/removeowner/v2', { channelId, uId }, { token });
}

export function messageSendV1(token: string, channelId: number, message: string) {
  return requestHelper('POST', '/message/send/v2', { channelId, message }, { token });
}

export function messageEditV1(token: string, messageId: number, message: string) {
  return requestHelper('PUT', '/message/edit/v2', { messageId, message }, { token });
}

export function messageRemoveV1(token: string, messageId: number) {
  return requestHelper('DELETE', '/message/remove/v2', { messageId }, { token });
}

export function dmCreateV1(token: string, uIds: number[]) {
  return requestHelper('POST', '/dm/create/v2', { uIds }, { token });
}

export function dmListV1(token: string) {
  return requestHelper('GET', '/dm/list/v2', {}, { token });
}

export function dmRemoveV1(token: string, dmId: number) {
  return requestHelper('DELETE', '/dm/remove/v2', { dmId }, { token });
}

export function dmDetailsV1(token: string, dmId: number) {
  return requestHelper('GET', '/dm/details/v2', { dmId }, { token });
}

export function dmLeaveV1(token: string, dmId: number) {
  return requestHelper('POST', '/dm/leave/v2', { dmId }, { token });
}

export function dmMessagesV1(token: string, dmId: number, start: number) {
  return requestHelper('GET', '/dm/messages/v2', { dmId, start }, { token });
}

export function messageSendDmV1(token: string, dmId: number, message: string) {
  return requestHelper('POST', '/message/senddm/v2', { dmId, message }, { token });
}

export function usersAllV1(token: string) {
  return requestHelper('GET', '/users/all/v2', {}, { token });
}

export function userProfileSetNameV1(token: string, nameFirst: string, nameLast: string) {
  return requestHelper('PUT', '/user/profile/setname/v2', { nameFirst, nameLast }, { token });
}

export function userProfileSetEmailV1(token: string, email: string) {
  return requestHelper('PUT', '/user/profile/setemail/v2', { email }, { token });
}

export function userProfileSetHandleV1(token: string, handleStr: string) {
  return requestHelper('PUT', '/user/profile/sethandle/v2', { handleStr }, { token });
}

export function notificationsGetV1(token: string) {
  return requestHelper('GET', '/notifications/get/v1', {}, { token });
}

export function searchV1(token: string, queryStr: string) {
  return requestHelper('GET', '/search/v1', { queryStr }, { token });
}

export function messageShareV1(token: string, ogMessageId: number, message: string, channelId: number, dmId: number) {
  return requestHelper('POST', '/message/share/v1', { ogMessageId, message, channelId, dmId }, { token });
}

export function messageReactV1(token: string, messageId: number, reactId: number) {
  return requestHelper('POST', '/message/react/v1', { messageId, reactId }, { token });
}

export function messageUnreactV1(token: string, messageId: number, reactId: number) {
  return requestHelper('POST', '/message/unreact/v1', { messageId, reactId }, { token });
}

export function messagePinV1(token: string, messageId: number) {
  return requestHelper('POST', '/message/pin/v1', { messageId }, { token });
}

export function messageUnpinV1(token: string, messageId: number) {
  return requestHelper('POST', '/message/unpin/v1', { messageId }, { token });
}

export function messageSendLaterV1(token: string, channelId: number, message: string, timeSent: number) {
  return requestHelper('POST', '/message/sendlater/v1', { channelId, message, timeSent }, { token });
}

export function messageSendLaterDmV1(token: string, dmId: number, message: string, timeSent: number) {
  return requestHelper('POST', '/message/sendlaterdm/v1', { dmId, message, timeSent }, { token });
}

export function standupStartV1(token: string, channelId: number, length: number) {
  return requestHelper('POST', '/standup/start/v1', { channelId, length }, { token });
}

export function standupActiveV1(token: string, channelId: number) {
  return requestHelper('GET', '/standup/active/v1', { channelId }, { token });
}

export function standupSendV1(token: string, channelId: number, message: string) {
  return requestHelper('POST', '/standup/send/v1', { channelId, message }, { token });
}

export function authPasswordresetRequestV1(email: string) {
  return requestHelper('POST', '/auth/passwordreset/request/v1', { email });
}

export function authPasswordresetResetV1(resetCode: string, newPassword: string) {
  return requestHelper('POST', '/auth/passwordreset/reset/v1', { resetCode, newPassword });
}

export function userProfileUploadPhotoV1(token: string, imgUrl: string, xStart: number, yStart: number, xEnd: number, yEnd: number) {
  return requestHelper('POST', '/user/profile/uploadphoto/v1', { imgUrl, xStart, yStart, xEnd, yEnd }, { token });
}

export function userStatsV1(token: string) {
  return requestHelper('GET', '/user/stats/v1', {}, { token });
}

export function usersStatsV1(token: string) {
  return requestHelper('GET', '/users/stats/v1', {}, { token });
}

export function adminUserRemoveV1(token: string, uId: number) {
  return requestHelper('DELETE', '/admin/user/remove/v1', { uId }, { token });
}

export function adminUserPermissionChangeV1(token: string, uId: number, permissionId: number) {
  return requestHelper('POST', '/admin/userpermission/change/v1', { uId, permissionId }, { token });
}
