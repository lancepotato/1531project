import { authLogoutV2, authRegisterV3, channelMessagesV2, channelsCreateV2, clearV1, messageSendV1 } from '../testHelperFunctions';

let token: string;
let channelId: number;

beforeEach(() => {
  clearV1();
  token = authRegisterV3('johnsmith@gmail.com', '12345678', 'John', 'Smith').token;
  channelId = channelsCreateV2(token, 'Channel', true).channelId;
});

describe('error cases', () => {
  test('Invalid channelId - does not refer to a valid channel', () => {
    const invalidChannelId = channelId + 1;
    const result = channelMessagesV2(token, invalidChannelId, 0);
    expect(result).toStrictEqual({ code: 400, error: 'invalid channelid' });
  });
  test('Start greater than total messages in channel', () => {
    const result = channelMessagesV2(token, channelId, 10);
    expect(result).toStrictEqual({ code: 400, error: 'start greater than total messages' });
  });
  test('Invalid token', () => {
    authLogoutV2(token);
    const result = channelMessagesV2(token, channelId, 0);
    expect(result).toStrictEqual({ code: 403, error: 'invalid token' });
  });
  test('User is not a member of channel', () => {
    const token2 = authRegisterV3('123@gmail.com', '12345678', 'J', 'Smith').token;
    const result = channelMessagesV2(token2, channelId, 0);
    expect(result).toStrictEqual({ code: 403, error: 'User is not a member of channel' });
  });
});
describe('success cases', () => {
  test('empty messages', () => {
    const result = channelMessagesV2(token, channelId, 0);
    expect(result).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });
  });
  test('< 50 messages, check recent is index 0', () => {
    messageSendV1(token, channelId, 'oldMessage');
    messageSendV1(token, channelId, 'recent');
    expect(channelMessagesV2(token, channelId, 0)).toStrictEqual(
      {
        messages: [
          {
            messageId: expect.any(Number),
            uId: expect.any(Number),
            message: 'recent',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          },
          {
            messageId: expect.any(Number),
            uId: expect.any(Number),
            message: 'oldMessage',
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
  test('more than 50 messages', () => {
    for (let i = 0; i < 52; i++) {
      messageSendV1(token, channelId, 'message');
    }
    expect(channelMessagesV2(token, channelId, 1)).toStrictEqual(
      {
        messages: expect.anything(),
        start: 1,
        end: 51,
      }
    );
    expect(channelMessagesV2(token, channelId, 1).messages.length).toStrictEqual(50);
  });
  test('latest is returned', () => {
    for (let i = 0; i < 50; i++) {
      messageSendV1(token, channelId, 'message');
    }
    expect(channelMessagesV2(token, channelId, 0)).toStrictEqual(
      {
        messages: expect.anything(),
        start: 0,
        end: -1,
      }
    );
    expect(channelMessagesV2(token, channelId, 0).messages.length).toStrictEqual(50);
  });
});
