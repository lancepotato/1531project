import { authUserId } from '../../interface';
import { authRegisterV3, channelJoinV2, channelMessagesV2, channelsCreateV2, clearV1, dmCreateV1, dmMessagesV1, messageReactV1, messageSendDmV1, messageSendV1 } from '../testHelperFunctions';

let user1: authUserId;
let user2: authUserId;
let channelId: number;
let dmId: number;
let messageId: number;
const reactId = 1;

describe('channel Cases', () => {
  beforeEach(() => {
    clearV1();
    user1 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId;
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
    messageId = messageSendV1(user1.token, channelId, 'hello').messageId;
  });
  test('invalid token', () => {
    const invalidToken = user1.token + user2.token;
    expect(messageReactV1(invalidToken, messageId, reactId)).toStrictEqual({ code: 403, error: 'invalid token' });
  });
  test('invalid messageId', () => {
    const invalidMessageId = messageId + 1;
    expect(messageReactV1(user1.token, invalidMessageId, reactId)).toStrictEqual({ code: 400, error: 'invalid messageId' });
  });
  test('user not in channel message is in', () => {
    expect(messageReactV1(user2.token, messageId, reactId)).toStrictEqual({ code: 400, error: 'user is not in dm/channel' });
  });
  test('invalid reactId', () => {
    const invalidReactId = reactId + 1;
    expect(messageReactV1(user1.token, messageId, invalidReactId)).toStrictEqual({ code: 400, error: 'invalid reactId' });
  });
  test('already reacted with that reactId', () => {
    messageReactV1(user1.token, messageId, reactId);
    expect(messageReactV1(user1.token, messageId, reactId)).toStrictEqual({ code: 400, error: 'already reacted with reactId' });
  });
  test('success, one react', () => {
    channelJoinV2(user2.token, channelId);
    messageReactV1(user1.token, messageId, reactId);
    const user1messages = channelMessagesV2(user1.token, channelId, 0).messages;
    const user2messages = channelMessagesV2(user2.token, channelId, 0).messages;
    expect(user1messages).toStrictEqual(
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
    expect(user2messages).toStrictEqual(
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
              isThisUserReacted: false,
            }
          ],
          isPinned: false,
        }
      ]
    );
  });
  test('success, two reacts', () => {
    channelJoinV2(user2.token, channelId);
    messageReactV1(user1.token, messageId, reactId);
    messageReactV1(user2.token, messageId, reactId);
    const user2messages = channelMessagesV2(user2.token, channelId, 0).messages;
    expect(user2messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: user1.authUserId,
          message: 'hello',
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [user1.authUserId, user2.authUserId],
              isThisUserReacted: true,
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
    user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId;
    dmId = dmCreateV1(user1.token, [user2.authUserId]).dmId;
    messageId = messageSendDmV1(user1.token, dmId, 'hello').messageId;
  });
  test('user not in dm message is in', () => {
    const user3 = authRegisterV3('jsmith@gmail.com', 'password', 'J', 'Smith') as authUserId;
    expect(messageReactV1(user3.token, messageId, reactId)).toStrictEqual({ code: 400, error: 'user is not in dm/channel' });
  });
  test('success, one react', () => {
    messageReactV1(user1.token, messageId, reactId);
    const user1messages = dmMessagesV1(user1.token, dmId, 0).messages;
    const user2messages = dmMessagesV1(user2.token, dmId, 0).messages;
    expect(user1messages).toStrictEqual(
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
    expect(user2messages).toStrictEqual(
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
              isThisUserReacted: false,
            }
          ],
          isPinned: false,
        }
      ]
    );
  });
  test('success, two reacts', () => {
    messageReactV1(user1.token, messageId, reactId);
    messageReactV1(user2.token, messageId, reactId);
    const user2messages = dmMessagesV1(user2.token, dmId, 0).messages;
    expect(user2messages).toStrictEqual(
      [
        {
          messageId: messageId,
          uId: user1.authUserId,
          message: 'hello',
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [user1.authUserId, user2.authUserId],
              isThisUserReacted: true,
            }
          ],
          isPinned: false,
        }
      ]
    );
  });
});
