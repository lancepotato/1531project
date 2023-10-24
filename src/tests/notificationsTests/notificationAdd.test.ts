import { authUserId } from '../../interface';
import { authRegisterV3, channelInviteV2, channelsCreateV2, clearV1, dmCreateV1, notificationsGetV1, userProfileV2 } from '../testHelperFunctions';

let user1: authUserId;
let user2: authUserId;
let user1handle: string;
let channelId: number;
let dmId: number;

beforeEach(() => {
  clearV1();
  user1 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
  user1handle = userProfileV2(user1.token, user1.authUserId).user.handleStr;
  user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId;
});

describe('adding notifications', () => {
  test('notify when added to channel', () => {
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
    channelInviteV2(user1.token, channelId, user2.authUserId);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} added you to Channel1`
        },
      ]
    );
  });
  test('notify when added to dm, multiple adds', () => {
    const user3 = authRegisterV3('jsmith@gmail.com', 'password', 'J', 'Smith') as authUserId;
    dmId = dmCreateV1(user1.token, [user2.authUserId, user3.authUserId]).dmId;
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual([]);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} added you to johnsmith, jsmith, luigimario`
        },
      ]
    );
    expect(notificationsGetV1(user3.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} added you to johnsmith, jsmith, luigimario`
        },
      ]
    );
  });
});
