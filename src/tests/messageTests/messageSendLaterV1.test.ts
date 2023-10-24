import { authRegisterV3, clearV1, messageSendV1, channelsCreateV2, messageSendLaterV1, channelMessagesV2 } from '../testHelperFunctions';
import { authUserId } from '../../interface';

const users: authUserId[] = [];
const tokens: string[] = [];
const uIds: number[] = [];
let channelId: number;
let messageId0: number;
let timeSent: number;

beforeEach(() => {
  clearV1();
  users[0] = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
  tokens[0] = users[0].token;
  uIds[0] = users[0].authUserId;

  users[1] = authRegisterV3('lancebai@hotmail.com', 'password1', 'Lance', 'Bai') as authUserId;
  tokens[1] = users[1].token;
  uIds[1] = users[1].authUserId;

  channelId = channelsCreateV2(tokens[0], 'Channel1', true).channelId;
  messageId0 = messageSendV1(tokens[0], channelId, 'original channel message').messageId;
  timeSent = Math.floor((new Date()).getTime() / 1000) + 2;
});

describe('error cases', () => {
  test('invalid token', () => {
    const invalidToken = tokens[0] + tokens[1];
    expect(messageSendLaterV1(invalidToken, channelId, 'message', timeSent)).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('invalid channelId', () => {
    const invalidId = channelId + 1;
    expect(messageSendLaterV1(tokens[0], invalidId, 'message', timeSent)).toStrictEqual({ code: 400, error: 'invalid channelId' });
  });

  test('length of message is more than 1000 characters', () => {
    expect(messageSendLaterV1(tokens[0], channelId, 'a'.repeat(1001), timeSent)).toStrictEqual({ code: 400, error: 'message length is greater than 1000' });
  });

  test('length of message is less than 1', () => {
    expect(messageSendLaterV1(tokens[0], channelId, '', timeSent)).toStrictEqual({ code: 400, error: 'message length is less than 1' });
  });

  test('timeSent is a time in the past', () => {
    const pastTimeSent = timeSent - 4;
    expect(messageSendLaterV1(tokens[0], channelId, 'message', pastTimeSent)).toStrictEqual({ code: 400, error: 'timeSent is in the past' });
  });

  test('user is not a member of channel', () => {
    expect(messageSendLaterV1(tokens[1], channelId, 'message', timeSent)).toStrictEqual({ code: 403, error: 'user is not in channel' });
  });
});

describe('success cases', () => {
  test('correct returns', () => {
    expect(messageSendLaterV1(tokens[0], channelId, 'message', timeSent)).toStrictEqual({ messageId: expect.any(Number) });
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2100);
  });

  test('message does not exist while waiting to be sent, message is sent', () => {
    const messageId1 = messageSendLaterV1(tokens[0], channelId, 'sent later message', timeSent).messageId;
    expect(channelMessagesV2(tokens[0], channelId, 0).messages[0]).toStrictEqual(
      {
        messageId: messageId0,
        uId: uIds[0],
        message: 'original channel message',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false
      }
    );
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2100);
    expect(channelMessagesV2(tokens[0], channelId, 0).messages).toStrictEqual(
      [
        {
          messageId: messageId1,
          uId: uIds[0],
          message: 'sent later message',
          timeSent: timeSent,
          reacts: [],
          isPinned: false
        },
        {
          messageId: messageId0,
          uId: uIds[0],
          message: 'original channel message',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        }
      ]
    );
  });

  test('sending another message while waiting for original to be sent', () => {
    const messageId1 = messageSendLaterV1(tokens[0], channelId, 'sent later message', timeSent).messageId;
    const messageId2 = messageSendV1(tokens[0], channelId, 'random middle message').messageId;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2100);
    expect(channelMessagesV2(tokens[0], channelId, 0).messages).toStrictEqual(
      [
        {
          messageId: messageId1,
          uId: uIds[0],
          message: 'sent later message',
          timeSent: timeSent,
          reacts: [],
          isPinned: false
        },
        {
          messageId: messageId2,
          uId: uIds[0],
          message: 'random middle message',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        },
        {
          messageId: messageId0,
          uId: uIds[0],
          message: 'original channel message',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        }
      ]
    );
  });
});
