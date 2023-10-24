import { authUserId } from '../../interface';
import { authRegisterV3, channelJoinV2, channelLeaveV1, channelsCreateV2, clearV1, dmCreateV1, dmLeaveV1, messageReactV1, messageSendDmV1, messageSendV1, messageUnreactV1, notificationsGetV1, userProfileV2 } from '../testHelperFunctions';

let user1: authUserId;
let user2: authUserId;
let user1handle: string;
let user2handle: string;
let channelId: number;
let dmId: number;
let messageId: number;
const reactId = 1;

describe('reacting notifications channel', () => {
  beforeEach(() => {
    clearV1();
    user1 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    user1handle = userProfileV2(user1.token, user1.authUserId).user.handleStr;
    user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId;
    user2handle = userProfileV2(user2.token, user2.authUserId).user.handleStr;
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
    messageId = messageSendV1(user1.token, channelId, 'no tag').messageId;
  });
  test('notify when reacts to own message', () => {
    messageReactV1(user1.token, messageId, reactId);
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} reacted to your message in Channel1`
        }
      ]
    );
  });
  test('notify when someone reacts to your message', () => {
    channelJoinV2(user2.token, channelId);
    messageReactV1(user2.token, messageId, reactId);
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user2handle} reacted to your message in Channel1`
        }
      ]
    );
  });
  test('notification stays after unreact', () => {
    messageReactV1(user1.token, messageId, reactId);
    messageUnreactV1(user1.token, messageId, reactId);
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} reacted to your message in Channel1`
        }
      ]
    );
  });
  test('does not notify when message sender leaves then message is reacted', () => {
    channelJoinV2(user2.token, channelId);
    channelLeaveV1(user1.token, channelId);
    messageReactV1(user2.token, messageId, reactId);
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual([]);
  });
});

describe('reacting notifications dm', () => {
  beforeEach(() => {
    clearV1();
    user1 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    user1handle = userProfileV2(user1.token, user1.authUserId).user.handleStr;
    user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId;
    user2handle = userProfileV2(user2.token, user2.authUserId).user.handleStr;
    dmId = dmCreateV1(user1.token, [user2.authUserId]).dmId;
    messageId = messageSendDmV1(user1.token, dmId, 'no tag').messageId;
  });
  test('notify when reacts to own message', () => {
    messageReactV1(user1.token, messageId, reactId);
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} reacted to your message in johnsmith, luigimario`
        },
      ]
    );
  });
  test('notify when someone reacts to your message', () => {
    channelJoinV2(user2.token, channelId);
    messageReactV1(user2.token, messageId, reactId);
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user2handle} reacted to your message in johnsmith, luigimario`
        },
      ]
    );
  });
  test('notification stays after unreact', () => {
    messageReactV1(user1.token, messageId, reactId);
    messageUnreactV1(user1.token, messageId, reactId);
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} reacted to your message in johnsmith, luigimario`
        },
      ]
    );
  });
  test('does not notify when message sender leaves then message is reacted', () => {
    dmLeaveV1(user1.token, dmId);
    messageReactV1(user2.token, messageId, reactId);
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual([]);
  });
});
