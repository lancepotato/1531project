import { authUserId } from '../../interface';
import { authRegisterV3, channelMessagesV2, channelsCreateV2, clearV1, dmCreateV1, dmMessagesV1, messageReactV1, messageSendDmV1, messageSendV1, messageUnreactV1 } from '../testHelperFunctions';

let user1: authUserId;
let channelId: number;
let dmId: number;
let messageId: number;
const reactId = 1;

describe('channel Cases', () => {
  beforeEach(() => {
    clearV1();
    user1 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
    messageId = messageSendV1(user1.token, channelId, 'hello').messageId;
    messageReactV1(user1.token, messageId, reactId);
  });
  test('invalid token', () => {
    const invalidToken = user1.token + 'a';
    expect(messageUnreactV1(invalidToken, messageId, reactId)).toStrictEqual({ code: 403, error: 'invalid token' });
  });
  test('invalid messageId', () => {
    const invalidMessageId = messageId + 1;
    expect(messageUnreactV1(user1.token, invalidMessageId, reactId)).toStrictEqual({ code: 400, error: 'invalid messageId' });
  });
  test('user not in channel message is in', () => {
    const user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId;
    expect(messageUnreactV1(user2.token, messageId, reactId)).toStrictEqual({ code: 400, error: 'user is not in dm/channel' });
  });
  test('invalid reactId', () => {
    const invalidReactId = reactId + 1;
    expect(messageUnreactV1(user1.token, messageId, invalidReactId)).toStrictEqual({ code: 400, error: 'invalid reactId' });
  });
  test('reactId has not been reacted', () => {
    messageUnreactV1(user1.token, messageId, reactId);
    expect(messageUnreactV1(user1.token, messageId, reactId)).toStrictEqual({ code: 400, error: 'user has not reacted with this reactId' });
  });
  test('success', () => {
    const messages = channelMessagesV2(user1.token, channelId, 0).messages;
    expect(messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: user1.authUserId,
          message: 'hello',
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [user1.authUserId],
              isThisUserReacted: true,
            }
          ],
          isPinned: false,
        }
      ]
    );
    messageUnreactV1(user1.token, messageId, reactId);
    const unreacted = channelMessagesV2(user1.token, channelId, 0).messages;
    expect(unreacted).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: user1.authUserId,
          message: 'hello',
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [],
              isThisUserReacted: false,
            }
          ],
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
    dmId = dmCreateV1(user1.token, []).dmId;
    messageId = messageSendDmV1(user1.token, dmId, 'hello').messageId;
    messageReactV1(user1.token, messageId, reactId);
  });
  test('user not in dm message is in', () => {
    const user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId;
    expect(messageUnreactV1(user2.token, messageId, reactId)).toStrictEqual({ code: 400, error: 'user is not in dm/channel' });
  });
  test('success', () => {
    const messages = dmMessagesV1(user1.token, dmId, 0).messages;
    expect(messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: user1.authUserId,
          message: 'hello',
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [user1.authUserId],
              isThisUserReacted: true,
            }
          ],
          isPinned: false,
        }
      ]
    );
    messageUnreactV1(user1.token, messageId, reactId);
    const unreacted = dmMessagesV1(user1.token, dmId, 0).messages;
    expect(unreacted).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: user1.authUserId,
          message: 'hello',
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [],
              isThisUserReacted: false,
            }
          ],
          isPinned: false,
        }
      ]
    );
  });
});
