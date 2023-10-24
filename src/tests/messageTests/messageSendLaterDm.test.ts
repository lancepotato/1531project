import { authRegisterV3, clearV1, messageSendDmV1, dmCreateV1, messageSendLaterDmV1, dmMessagesV1 } from '../testHelperFunctions';
import { authUserId } from '../../interface';

const users: authUserId[] = [];
const tokens: string[] = [];
const uIds: number[] = [];
let dmId: number;
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

  dmId = dmCreateV1(tokens[0], [uIds[1]]).dmId;
  messageId0 = messageSendDmV1(tokens[0], dmId, 'original dm message').messageId;
  timeSent = Math.floor((new Date()).getTime() / 1000) + 2;
});

describe('error cases', () => {
  test('invalid token', () => {
    const invalidToken = tokens[0] + tokens[1];
    expect(messageSendLaterDmV1(invalidToken, dmId, 'message', timeSent)).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('invalid dmId', () => {
    const invalidId = dmId + 1;
    expect(messageSendLaterDmV1(tokens[0], invalidId, 'message', timeSent)).toStrictEqual({ code: 400, error: 'invalid dmId' });
  });

  test('length of message is more than 1000 characters', () => {
    expect(messageSendLaterDmV1(tokens[0], dmId, 'a'.repeat(1001), timeSent)).toStrictEqual({ code: 400, error: 'message length is greater than 1000' });
  });

  test('length of message is less than 1', () => {
    expect(messageSendLaterDmV1(tokens[0], dmId, '', timeSent)).toStrictEqual({ code: 400, error: 'message length is less than 1' });
  });

  test('timeSent is a time in the past', () => {
    const pastTimeSent = timeSent - 4;
    expect(messageSendLaterDmV1(tokens[0], dmId, 'message', pastTimeSent)).toStrictEqual({ code: 400, error: 'timeSent is in the past' });
  });

  test('user is not a member of dm', () => {
    users[2] = authRegisterV3('waduhek@gmail.com', 'password2', 'Wadu', 'Hek') as authUserId;
    expect(messageSendLaterDmV1(users[2].token, dmId, 'message', timeSent)).toStrictEqual({ code: 403, error: 'user is not in dm' });
  });
});

describe('success cases', () => {
  test('correct returns', () => {
    expect(messageSendLaterDmV1(tokens[0], dmId, 'message', timeSent)).toStrictEqual({ messageId: expect.any(Number) });
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2100);
  });

  test('message does not exist while waiting to be sent, message is sent', () => {
    const messageId1 = messageSendLaterDmV1(tokens[0], dmId, 'sent later message', timeSent).messageId;
    expect(dmMessagesV1(tokens[0], dmId, 0).messages[0]).toStrictEqual(
      {
        messageId: messageId0,
        uId: uIds[0],
        message: 'original dm message',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false
      }
    );
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2100);
    expect(dmMessagesV1(tokens[0], dmId, 0).messages).toStrictEqual(
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
          message: 'original dm message',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        }
      ]
    );
  });

  test('sending another message while waiting for original to be sent', () => {
    const messageId1 = messageSendLaterDmV1(tokens[0], dmId, 'sent later message', timeSent).messageId;
    const messageId2 = messageSendDmV1(tokens[0], dmId, 'random middle message').messageId;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2100);
    expect(dmMessagesV1(tokens[0], dmId, 0).messages).toStrictEqual(
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
          message: 'original dm message',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        }
      ]
    );
  });
});
