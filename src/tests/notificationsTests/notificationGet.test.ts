import { authUserId } from '../../interface';
import { authRegisterV3, channelsCreateV2, clearV1, messageSendV1, notificationsGetV1, userProfileV2 } from '../testHelperFunctions';

let user1: authUserId;
let user1handle: string;
let channelId: number;

describe('notificationsGet', () => {
  beforeEach(() => {
    clearV1();
    user1 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    user1handle = userProfileV2(user1.token, user1.authUserId).user.handleStr;
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
  });
  test('invalid token', () => {
    expect(notificationsGetV1(user1.token + 'a')).toStrictEqual({ code: 403, error: 'invalid token' });
  });
  test('ordered from recent to least recent', () => {
    messageSendV1(user1.token, channelId, `@${user1handle} old`);
    messageSendV1(user1.token, channelId, `@${user1handle} recent`);
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} tagged you in Channel1: @${user1handle} recent`
        },
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} tagged you in Channel1: @${user1handle} old`
        },
      ]
    );
  });
  test('most recent 20 notifications only', () => {
    for (let i = 0; i < 25; i++) {
      messageSendV1(user1.token, channelId, `@${user1handle}`);
    }
    const notifications = notificationsGetV1(user1.token).notifications;
    expect(notifications.length).toStrictEqual(20);
  });
});
