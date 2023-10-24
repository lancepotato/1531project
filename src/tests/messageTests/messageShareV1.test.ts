import { authRegisterV3, clearV1, channelsCreateV2, channelJoinV2, messageSendV1, messageEditV1, dmCreateV1, dmMessagesV1, messageSendDmV1, channelMessagesV2, messageShareV1 } from '../testHelperFunctions';
import { authUserId } from '../../interface';

const users: authUserId[] = [];
const tokens: string[] = [];
const uIds: number[] = [];
const channelIds: number[] = [];
const messageIds: number[] = [];
const dmIds: number[] = [];

beforeEach(() => {
  clearV1();
  users[0] = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
  tokens[0] = users[0].token;

  users[1] = authRegisterV3('lancebai@hotmail.com', 'password1', 'Lance', 'Bai') as authUserId;
  tokens[1] = users[1].token;
  uIds[1] = users[1].authUserId;

  users[2] = authRegisterV3('jimjohnson@gmail.com', 'password2', 'Jim', 'Johnson') as authUserId;
  tokens[2] = users[2].token;
  uIds[2] = users[2].authUserId;

  users[3] = authRegisterV3('johnsmith@gmail.com', 'password3', 'John', 'Smith') as authUserId;
  tokens[3] = users[3].token;
  uIds[3] = users[3].authUserId;

  channelIds[0] = channelsCreateV2(tokens[0], 'Channel1', true).channelId;
  channelIds[1] = channelsCreateV2(tokens[1], 'Channel2', true).channelId;
  channelJoinV2(tokens[2], channelIds[0]);
  channelJoinV2(tokens[2], channelIds[1]);
  dmIds[0] = dmCreateV1(tokens[0], [uIds[1], uIds[2]]).dmId;
  dmIds[1] = dmCreateV1(tokens[1], [uIds[2], uIds[3]]).dmId;
  messageIds[0] = messageSendV1(tokens[0], channelIds[0], 'original channel message').messageId;
  messageIds[1] = messageSendDmV1(tokens[0], dmIds[0], 'original dm message').messageId;
});

describe('error testing', () => {
  test('invalid token', () => {
    const invalidToken = tokens[0] + tokens[1] + tokens[2] + tokens[3];
    expect(messageShareV1(invalidToken, messageIds[0], 'extra message', channelIds[1], -1)).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('both channelId and dmId are invalid', () => {
    const invalidChannelId = channelIds[0] + channelIds[1] + 1;
    const invalidDmId = dmIds[0] + dmIds[1] + 1;
    expect(messageShareV1(tokens[0], messageIds[0], 'extra message', invalidChannelId, invalidDmId)).toStrictEqual({ code: 400, error: 'invalid channelId and dmId' });
  });

  test('neither channelId or dmId are -1', () => {
    expect(messageShareV1(tokens[0], messageIds[0], 'extra message', channelIds[0], dmIds[0])).toStrictEqual({ code: 400, error: 'neither channelId or dmId are -1' });
  });

  test('invalid ogMessageId (user is not in channel that message is in)', () => {
    expect(messageShareV1(tokens[3], messageIds[1], 'extra message', -1, dmIds[1])).toStrictEqual({ code: 400, error: 'invalid messageId' });
  });

  test('invalid ogMessageId (messageId does not exist in data store)', () => {
    const invalidMessageId = messageIds[0] + messageIds[1] + 1;
    expect(messageShareV1(tokens[2], invalidMessageId, 'extra message', channelIds[0], -1)).toStrictEqual({ code: 400, error: 'invalid messageId' });
  });

  test('length of optional message is more than 1000 characters', () => {
    expect(messageShareV1(tokens[2], messageIds[0], 'a'.repeat(1001), channelIds[1], -1)).toStrictEqual({ code: 400, error: 'message length is greater than 1000' });
  });

  test('user has not joined the channel/dm they are sharing to', () => {
    expect(messageShareV1(tokens[0], messageIds[1], 'extra message', -1, dmIds[1])).toStrictEqual({ code: 403, error: 'user is not in target channel/dm' });
  });
});

describe('successful returns', () => {
  test('channel -> DM', () => {
    expect(messageShareV1(tokens[2], messageIds[0], 'extra message', -1, dmIds[0])).toStrictEqual({ sharedMessageId: expect.any(Number) });
    expect(dmMessagesV1(tokens[2], dmIds[0], 0).messages[0].message).toStrictEqual('original channel message extra message');
  });

  test('channel -> channel', () => {
    expect(messageShareV1(tokens[2], messageIds[0], 'extra message', channelIds[1], -1)).toStrictEqual({ sharedMessageId: expect.any(Number) });
    expect(channelMessagesV2(tokens[2], channelIds[1], 0).messages[0].message).toStrictEqual('original channel message extra message');
  });

  test('DM -> channel', () => {
    expect(messageShareV1(tokens[2], messageIds[1], 'extra message', channelIds[0], -1)).toStrictEqual({ sharedMessageId: expect.any(Number) });
    expect(channelMessagesV2(tokens[2], channelIds[0], 0).messages[0].message).toStrictEqual('original dm message extra message');
  });

  test('DM -> DM', () => {
    expect(messageShareV1(tokens[2], messageIds[1], 'extra message', -1, dmIds[1])).toStrictEqual({ sharedMessageId: expect.any(Number) });
    expect(dmMessagesV1(tokens[2], dmIds[1], 0).messages[0].message).toStrictEqual('original dm message extra message');
  });

  test('share to same channel', () => {
    expect(messageShareV1(tokens[0], messageIds[0], 'extra message', channelIds[0], -1)).toStrictEqual({ sharedMessageId: expect.any(Number) });
    const messages = channelMessagesV2(tokens[0], channelIds[0], 0).messages;
    const message0 = messages[0].message;
    const message1 = messages[1].message;
    expect(message0).toStrictEqual('original channel message extra message');
    expect(message1).toStrictEqual('original channel message');
  });

  test('share to same DM', () => {
    expect(messageShareV1(tokens[0], messageIds[1], 'extra message', -1, dmIds[0])).toStrictEqual({ sharedMessageId: expect.any(Number) });
    const messages = dmMessagesV1(tokens[0], dmIds[0], 0).messages;
    const message0 = messages[0].message;
    const message1 = messages[1].message;
    expect(message0).toStrictEqual('original dm message extra message');
    expect(message1).toStrictEqual('original dm message');
  });

  test('empty optional message', () => {
    expect(messageShareV1(tokens[2], messageIds[0], '', -1, dmIds[0])).toStrictEqual({ sharedMessageId: expect.any(Number) });
    expect(dmMessagesV1(tokens[2], dmIds[0], 0).messages[0].message).toStrictEqual('original channel message');
  });

  test('message has been shared, original message is edited', () => {
    expect(messageShareV1(tokens[2], messageIds[0], 'extra message', -1, dmIds[0])).toStrictEqual({ sharedMessageId: expect.any(Number) });
    expect(dmMessagesV1(tokens[2], dmIds[0], 0).messages[0].message).toStrictEqual('original channel message extra message');
    messageEditV1(tokens[0], messageIds[0], 'edited message');
    expect(dmMessagesV1(tokens[2], dmIds[0], 0).messages[0].message).toStrictEqual('original channel message extra message');
  });
});
