import { authUserId } from '../../interface';
import { authRegisterV3, channelJoinV2, channelMessagesV2, channelsCreateV2, clearV1, dmCreateV1, dmMessagesV1, messagePinV1, messageSendDmV1, messageSendV1, messageUnpinV1 } from '../testHelperFunctions';

let user1: authUserId;
let user2: authUserId;
let channelId: number;
let dmId: number;
let messageId: number;

describe('channel Cases', () => {
  beforeEach(() => {
    clearV1();
    user1 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId;
    channelId = channelsCreateV2(user2.token, 'Channel1', true).channelId;
    messageId = messageSendV1(user2.token, channelId, 'hello').messageId;
    messagePinV1(user2.token, messageId);
  });
  test('invalid token', () => {
    const invalidToken = user1.token + user2.token;
    expect(messageUnpinV1(invalidToken, messageId)).toStrictEqual({ code: 403, error: 'invalid token' });
  });
  test('invalid messageId', () => {
    const invalidMessageId = messageId + 1;
    expect(messageUnpinV1(user1.token, invalidMessageId)).toStrictEqual({ code: 400, error: 'invalid messageId' });
  });
  test('user not in channel message is in', () => {
    expect(messageUnpinV1(user1.token, messageId)).toStrictEqual({ code: 400, error: 'user is not in dm/channel' });
  });
  test('message not pinned', () => {
    messageUnpinV1(user2.token, messageId);
    expect(messageUnpinV1(user2.token, messageId)).toStrictEqual({ code: 400, error: 'message not pinned' });
  });
  test('not owner, not global owner', () => {
    const user3 = authRegisterV3('jsmith@gmail.com', 'password', 'J', 'Smith') as authUserId;
    channelJoinV2(user3.token, channelId);
    expect(messageUnpinV1(user3.token, messageId)).toStrictEqual({ code: 403, error: 'user is not owner' });
  });
  test('success, not owner, is global owner', () => {
    channelJoinV2(user1.token, channelId);
    const messages = channelMessagesV2(user2.token, channelId, 0).messages;
    expect(messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: user2.authUserId,
          message: 'hello',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: true,
        }
      ]
    );
    messageUnpinV1(user1.token, messageId);
    const unpinned = channelMessagesV2(user2.token, channelId, 0).messages;
    expect(unpinned).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: user2.authUserId,
          message: 'hello',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        }
      ]
    );
  });
  test('success, is owner', () => {
    const messages = channelMessagesV2(user2.token, channelId, 0).messages;
    expect(messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: user2.authUserId,
          message: 'hello',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: true,
        }
      ]
    );
    messageUnpinV1(user2.token, messageId);
    const unpinned = channelMessagesV2(user2.token, channelId, 0).messages;
    expect(unpinned).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: user2.authUserId,
          message: 'hello',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        }
      ]
    );
  });
});

describe('Dm cases', () => {
  beforeEach(() => {
    clearV1();
    user1 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId;
    dmId = dmCreateV1(user2.token, [user1.authUserId]).dmId;
    messageId = messageSendDmV1(user2.token, dmId, 'hello').messageId;
    messagePinV1(user2.token, messageId);
  });
  test('user not in dm message is in', () => {
    const user3 = authRegisterV3('jsmith@gmail.com', 'password', 'J', 'Smith') as authUserId;
    expect(messageUnpinV1(user3.token, messageId)).toStrictEqual({ code: 400, error: 'user is not in dm/channel' });
  });
  test('error, not owner, is global owner', () => {
    expect(messageUnpinV1(user1.token, messageId)).toStrictEqual({ code: 403, error: 'user is not owner' });
  });
  test('success', () => {
    const messages = dmMessagesV1(user1.token, dmId, 0).messages;
    expect(messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: user2.authUserId,
          message: 'hello',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: true,
        }
      ]
    );
    messageUnpinV1(user2.token, messageId);
    const unpinned = dmMessagesV1(user2.token, dmId, 0).messages;
    expect(unpinned).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: user2.authUserId,
          message: 'hello',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        }
      ]
    );
  });
});
