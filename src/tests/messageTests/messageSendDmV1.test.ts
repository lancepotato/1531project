import { authRegisterV3, clearV1, dmCreateV1, messageSendDmV1, dmMessagesV1, messageSendV1, channelsCreateV2 } from '../testHelperFunctions';
import { authUserId } from '../../interface';

let user0: authUserId;
let user1: authUserId;
let user2: authUserId;
let user3: authUserId;
let token0: string;
let token1: string;
let token2: string;
let token3: string;
let uId1: number;
let uId2: number;
let uIds: number[];
let dmId: number;

describe('error testing', () => {
  beforeEach(() => {
    clearV1();
    user0 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    token0 = user0.token;

    user1 = authRegisterV3('lancebai@hotmail.com', 'password1', 'Lance', 'Bai') as authUserId;
    token1 = user1.token;
    uId1 = user1.authUserId;

    user2 = authRegisterV3('jimjohnson@gmail.com', 'password2', 'Jim', 'Johnson') as authUserId;
    token2 = user2.token;
    uId2 = user2.authUserId;

    user3 = authRegisterV3('johnsmith@gmail.com', 'password3', 'John', 'Smith') as authUserId;
    token3 = user3.token;

    uIds = [uId1, uId2];

    dmId = dmCreateV1(token0, uIds).dmId;
  });

  test('invalid token', () => {
    const invalidToken = token0 + token1 + token2 + token3;
    expect(messageSendDmV1(invalidToken, dmId, 'message')).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('invalid dmId', () => {
    const invalidDmId = dmId + 1;
    expect(messageSendDmV1(token0, invalidDmId, 'message')).toStrictEqual({ code: 400, error: 'invalid dmId' });
  });

  test('length of message is less than 1', () => {
    expect(messageSendDmV1(token0, dmId, '')).toStrictEqual({ code: 400, error: 'message length is less than 1' });
  });

  test('length of message is greater than 1000', () => {
    const message = 'a'.repeat(1001);
    expect(messageSendDmV1(token1, dmId, message)).toStrictEqual({ code: 400, error: 'message length is greater than 1000' });
  });

  test('dmId is valid, but user is not a member of DM', () => {
    expect(messageSendDmV1(token3, dmId, 'message')).toStrictEqual({ code: 403, error: 'user is not in DM' });
  });
});

describe('successful returns', () => {
  beforeEach(() => {
    clearV1();
    user0 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    token0 = user0.token;

    user1 = authRegisterV3('lancebai@hotmail.com', 'password1', 'Lance', 'Bai') as authUserId;
    token1 = user1.token;
    uId1 = user1.authUserId;

    user2 = authRegisterV3('jimjohnson@gmail.com', 'password2', 'Jim', 'Johnson') as authUserId;
    token2 = user2.token;
    uId2 = user2.authUserId;

    user3 = authRegisterV3('johnsmith@gmail.com', 'password3', 'John', 'Smith') as authUserId;
    token3 = user3.token;

    uIds = [uId1, uId2];

    dmId = dmCreateV1(token0, uIds).dmId;
  });

  test('returns messageId', () => {
    expect(messageSendDmV1(token1, dmId, 'message')).toStrictEqual({ messageId: expect.any(Number) });
  });

  test('message is created in data', () => {
    const messageId = messageSendDmV1(token1, dmId, 'message').messageId;
    expect(dmMessagesV1(token1, dmId, 0)).toStrictEqual(
      {
        messages: [
          {
            messageId: messageId,
            uId: uId1,
            message: 'message',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ],
        start: 0,
        end: -1
      }
    );
  });

  test('messageId is unique, regardless of being in DM or channel', () => {
    const channelId = channelsCreateV2(token0, 'Channel1', true).channelId;
    const channelMessageId = messageSendV1(token0, channelId, 'channel message').messageId;
    const dmMessageId = messageSendDmV1(token0, dmId, 'dm message').messageId;
    expect(dmMessageId).not.toStrictEqual(channelMessageId);
  });
});
