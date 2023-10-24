import { authUserId } from '../../interface';
import { authRegisterV3, channelJoinV2, channelLeaveV1, channelsCreateV2, clearV1, dmCreateV1, dmLeaveV1, messageEditV1, messageRemoveV1, messageSendDmV1, messageSendLaterV1, messageSendLaterDmV1, messageSendV1, messageShareV1, notificationsGetV1, userProfileV2 } from '../testHelperFunctions';

let user1: authUserId;
let user2: authUserId;
let user1handle: string;
let user2handle: string;
let channelId: number;
let dmId: number;
let messageId: number;

describe('tagging notifications channel', () => {
  beforeEach(() => {
    clearV1();
    user1 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    user1handle = userProfileV2(user1.token, user1.authUserId).user.handleStr;
    user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId;
    user2handle = userProfileV2(user2.token, user2.authUserId).user.handleStr;
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
  });
  test('handle is invalid or user is not member of channel', () => {
    messageSendV1(user1.token, channelId, `@${user2handle} hello`);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual([]);
  });
  test('user is no longer member of channel', () => {
    channelJoinV2(user2.token, channelId);
    channelLeaveV1(user1.token, channelId);
    messageSendV1(user2.token, channelId, `@${user1handle} hello`);
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual([]);
  });
  test('user tags themselves', () => {
    messageSendV1(user1.token, channelId, `@${user1handle} hello`);
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} tagged you in Channel1: @${user1handle} hello`
        }
      ]
    );
  });
  test('message with multiple tags', () => {
    channelJoinV2(user2.token, channelId);
    const user3 = authRegisterV3('jsmith@gmail.com', 'password', 'J', 'Smith');
    const user3handle = userProfileV2(user3.token, user3.authUserId).user.handleStr;
    channelJoinV2(user3.token, channelId);
    const message = `@${user2handle} @${user3handle} hello`;
    messageSendV1(user1.token, channelId, message);
    const sliced = message.slice(0, 20);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} tagged you in Channel1: ${sliced}`
        }
      ]
    );
    expect(notificationsGetV1(user3.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} tagged you in Channel1: ${sliced}`
        }
      ]
    );
  });
  test('duplicates tags, only one notification', () => {
    channelJoinV2(user2.token, channelId);
    const message = `@${user2handle} @${user2handle} hello`;
    messageSendV1(user1.token, channelId, message);
    const sliced = message.slice(0, 20);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} tagged you in Channel1: ${sliced}`
        }
      ]
    );
  });
  test('notify when message is edited with tag', () => {
    channelJoinV2(user2.token, channelId);
    messageId = messageSendV1(user1.token, channelId, 'message with no tag').messageId;
    const message = `@${user2handle} hello`;
    messageEditV1(user1.token, messageId, message);
    const sliced = message.slice(0, 20);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} tagged you in Channel1: ${sliced}`
        }
      ]
    );
  });
  test('notify when original message has tag but edited', () => {
    channelJoinV2(user2.token, channelId);
    const message = `@${user2handle} hello`;
    messageId = messageSendV1(user1.token, channelId, message).messageId;
    const sliced = message.slice(0, 20);
    messageEditV1(user1.token, messageId, 'message with no tag');
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} tagged you in Channel1: ${sliced}`
        }
      ]
    );
  });
  test('notify when original message has tag but removed', () => {
    channelJoinV2(user2.token, channelId);
    const message = `@${user2handle} hello`;
    messageId = messageSendV1(user1.token, channelId, message).messageId;
    const sliced = message.slice(0, 20);
    messageRemoveV1(user1.token, messageId);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} tagged you in Channel1: ${sliced}`
        }
      ]
    );
  });
  test('does not notify when message shares ogMessage contains a tag', () => {
    const channelId2 = channelsCreateV2(user1.token, 'Channel2', true).channelId;
    const message = `@${user2handle} hello`;
    const ogMessageId = messageSendV1(user1.token, channelId2, message).messageId;
    channelJoinV2(user2.token, channelId);
    messageShareV1(user1.token, ogMessageId, 'no tag', channelId, -1);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual([]);
  });
  test('notify when message shares optional message contains a tag', () => {
    const channelId2 = channelsCreateV2(user1.token, 'Channel2', true).channelId;
    const ogMessageId = messageSendV1(user1.token, channelId2, 'no tag').messageId;
    channelJoinV2(user2.token, channelId);
    const message = `@${user2handle} hello`;
    messageShareV1(user1.token, ogMessageId, message, channelId, -1);
    const sliced = message.slice(0, 20);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} tagged you in Channel1: ${sliced}`
        }
      ]
    );
  });
  test('tags in messageSendLater', () => {
    channelJoinV2(user2.token, channelId);
    const message = `@${user2handle} hello`;
    const timeSent = Math.floor((new Date()).getTime() / 1000) + 2;
    messageSendLaterV1(user1.token, channelId, message, timeSent);
    const sliced = message.slice(0, 20);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual([]);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2100);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: channelId,
          dmId: -1,
          notificationMessage: `${user1handle} tagged you in Channel1: ${sliced}`
        }
      ]
    );
  });
});

describe('tagging notifications dm', () => {
  beforeEach(() => {
    clearV1();
    user1 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    user1handle = userProfileV2(user1.token, user1.authUserId).user.handleStr;
    user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId;
    user2handle = userProfileV2(user2.token, user2.authUserId).user.handleStr;
    dmId = dmCreateV1(user1.token, [user2.authUserId]).dmId;
  });
  test('handle is invalid or user is not member of dm', () => {
    const user3 = authRegisterV3('jsmith@gmail.com', 'password', 'J', 'Smith');
    const user3handle = userProfileV2(user3.token, user3.authUserId).user.handleStr;
    messageSendDmV1(user1.token, dmId, `@${user3handle} hello`);
    expect(notificationsGetV1(user3.token).notifications).toStrictEqual([]);
  });
  test('user is no longer member of dm', () => {
    dmLeaveV1(user2.token, dmId);
    messageSendDmV1(user1.token, dmId, `@${user2handle} hello`);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} added you to johnsmith, luigimario`
        },
      ]
    );
  });
  test('user tags themselves', () => {
    messageSendDmV1(user1.token, dmId, `@${user1handle} hello`);
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} tagged you in johnsmith, luigimario: @${user1handle} hello`
        },
      ]
    );
  });
  test('message with multiple tags', () => {
    const message = `@${user2handle} @${user1handle} hello`;
    messageSendDmV1(user1.token, dmId, message);
    const sliced = message.slice(0, 20);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} tagged you in johnsmith, luigimario: ${sliced}`
        },
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} added you to johnsmith, luigimario`
        },
      ]
    );
    expect(notificationsGetV1(user1.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} tagged you in johnsmith, luigimario: ${sliced}`
        },
      ]
    );
  });
  test('duplicates tags, only one notification', () => {
    const message = `@${user2handle} @${user2handle} hello`;
    messageSendDmV1(user1.token, dmId, message);
    const sliced = message.slice(0, 20);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} tagged you in johnsmith, luigimario: ${sliced}`
        },
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} added you to johnsmith, luigimario`
        },
      ]
    );
  });
  test('notify when message is edited with tag', () => {
    messageId = messageSendDmV1(user1.token, dmId, 'message with no tag').messageId;
    const message = `@${user2handle} hello`;
    messageEditV1(user1.token, messageId, message);
    const sliced = message.slice(0, 20);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} tagged you in johnsmith, luigimario: ${sliced}`
        },
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} added you to johnsmith, luigimario`
        },
      ]
    );
  });
  test('notify when original message has tag but edited', () => {
    const message = `@${user2handle} hello`;
    messageId = messageSendDmV1(user1.token, dmId, message).messageId;
    const sliced = message.slice(0, 20);
    messageEditV1(user1.token, messageId, 'message with no tag');
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} tagged you in johnsmith, luigimario: ${sliced}`
        },
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} added you to johnsmith, luigimario`
        },
      ]
    );
  });
  test('notify when original message has tag but removed', () => {
    const message = `@${user2handle} hello`;
    messageId = messageSendDmV1(user1.token, dmId, message).messageId;
    const sliced = message.slice(0, 20);
    messageRemoveV1(user1.token, messageId);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} tagged you in johnsmith, luigimario: ${sliced}`
        },
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} added you to johnsmith, luigimario`
        },
      ]
    );
  });
  test('tags in messageSendLaterDm', () => {
    const message = `@${user2handle} hello`;
    const timeSent = Math.floor((new Date()).getTime() / 1000) + 2;
    messageSendLaterDmV1(user1.token, dmId, message, timeSent);
    const sliced = message.slice(0, 20);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} added you to johnsmith, luigimario`
        },
      ]
    );
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2100);
    expect(notificationsGetV1(user2.token).notifications).toStrictEqual(
      [
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} tagged you in johnsmith, luigimario: ${sliced}`
        },
        {
          channelId: -1,
          dmId: dmId,
          notificationMessage: `${user1handle} added you to johnsmith, luigimario`
        },
      ]
    );
  });
});
