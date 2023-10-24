import { authRegisterV3, channelsCreateV2, clearV1, dmCreateV1, dmRemoveV1, messageRemoveV1, messageSendDmV1, messageSendLaterV1, messageSendV1, messageShareV1, usersStatsV1, standupStartV1, standupSendV1, channelInviteV2 } from '../testHelperFunctions';
import { authUserId } from '../../interface';

const users: authUserId[] = [];
const tokens: string[] = [];
const uIds: number[] = [];
let timeStart: number;

beforeEach(() => {
  clearV1();
  users[0] = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
  tokens[0] = users[0].token;
  uIds[0] = users[0].authUserId;

  users[1] = authRegisterV3('lancebai@hotmail.com', 'password1', 'Lance', 'Bai') as authUserId;
  tokens[1] = users[1].token;
  uIds[1] = users[1].authUserId;
});

test('invalid token', () => {
  const invalidToken = tokens[0] + 'a';
  expect(usersStatsV1(invalidToken)).toStrictEqual({ code: 403, error: 'invalid token' });
});

test('first metric has 0 items existing', () => {
  expect(usersStatsV1(tokens[0]).workspaceStats).toStrictEqual({
    channelsExist: [
      { numChannelsExist: 0, timeStamp: expect.any(Number) }
    ],
    dmsExist: [
      { numDmsExist: 0, timeStamp: expect.any(Number) }
    ],
    messagesExist: [
      { numMessagesExist: 0, timeStamp: expect.any(Number) }
    ],
    utilizationRate: 0
  });
});

describe('channel cases', () => {
  test('create channel', () => {
    channelsCreateV2(tokens[0], 'Channel1', true);
    const stats = usersStatsV1(tokens[0]).workspaceStats;
    expect(stats.channelsExist).toStrictEqual(
      [
        { numChannelsExist: 0, timeStamp: expect.any(Number) },
        { numChannelsExist: 1, timeStamp: expect.any(Number) }
      ]
    );
    expect(usersStatsV1(tokens[0]).workspaceStats.utilizationRate).toStrictEqual(1 / 2);
  });
});

describe('dm cases', () => {
  test('create dm', () => {
    dmCreateV1(tokens[0], [uIds[1]]);
    const stats = usersStatsV1(tokens[0]).workspaceStats;
    expect(stats.dmsExist).toStrictEqual(
      [
        { numDmsExist: 0, timeStamp: expect.any(Number) },
        { numDmsExist: 1, timeStamp: expect.any(Number) }
      ]
    );
    expect(stats.utilizationRate).toStrictEqual(1);
  });

  test('remove dm', () => {
    const dmId = dmCreateV1(tokens[0], [uIds[1]]).dmId;
    expect(usersStatsV1(tokens[0]).workspaceStats.dmsExist).toStrictEqual(
      [
        { numDmsExist: 0, timeStamp: expect.any(Number) },
        { numDmsExist: 1, timeStamp: expect.any(Number) }
      ]
    );
    dmRemoveV1(tokens[0], dmId);
    const stats = usersStatsV1(tokens[0]).workspaceStats;
    expect(stats.dmsExist).toStrictEqual(
      [
        { numDmsExist: 0, timeStamp: expect.any(Number) },
        { numDmsExist: 1, timeStamp: expect.any(Number) },
        { numDmsExist: 0, timeStamp: expect.any(Number) }
      ]
    );
    expect(stats.utilizationRate).toStrictEqual(0);
  });
});

describe('message cases', () => {
  test('create 2 messages in a channel and dm', () => {
    const channelId = channelsCreateV2(tokens[0], 'Channel1', true).channelId;
    messageSendV1(tokens[0], channelId, 'message 1');
    messageSendV1(tokens[0], channelId, 'message 2');
    expect(usersStatsV1(tokens[0]).workspaceStats.messagesExist).toStrictEqual(
      [
        { numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 2, timeStamp: expect.any(Number) }
      ]
    );
    const dmId = dmCreateV1(tokens[0], [uIds[1]]).dmId;
    messageSendDmV1(tokens[0], dmId, 'dm message 1');
    const stats = usersStatsV1(tokens[0]).workspaceStats;
    expect(stats.messagesExist).toStrictEqual(
      [
        { numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 2, timeStamp: expect.any(Number) },
        { numMessagesExist: 3, timeStamp: expect.any(Number) }
      ]
    );
    expect(stats.utilizationRate).toStrictEqual(1);
  });

  test('remove messages', () => {
    const channelId = channelsCreateV2(tokens[0], 'Channel1', true).channelId;
    const messageId = messageSendV1(tokens[0], channelId, 'message 1').messageId;
    messageRemoveV1(tokens[0], messageId);
    expect(usersStatsV1(tokens[0]).workspaceStats.messagesExist).toStrictEqual(
      [
        { numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 0, timeStamp: expect.any(Number) }
      ]
    );
    const dmId = dmCreateV1(tokens[0], [uIds[1]]).dmId;
    const dmMessageId = messageSendDmV1(tokens[0], dmId, 'dm message 1').messageId;
    messageRemoveV1(tokens[0], dmMessageId);
    const stats = usersStatsV1(tokens[0]).workspaceStats;
    expect(stats.messagesExist).toStrictEqual(
      [
        { numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 0, timeStamp: expect.any(Number) }
      ]
    );
    expect(stats.utilizationRate).toStrictEqual(1);
  });

  test('remove dm that contains messages', () => {
    const dmId = dmCreateV1(tokens[0], [uIds[1]]).dmId;
    messageSendDmV1(tokens[0], dmId, 'dm message 1');
    messageSendDmV1(tokens[0], dmId, 'dm message 2');
    messageSendDmV1(tokens[0], dmId, 'dm message 3');
    dmRemoveV1(tokens[0], dmId);
    const stats = usersStatsV1(tokens[0]).workspaceStats;
    expect(stats.messagesExist).toStrictEqual(
      [
        { numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 2, timeStamp: expect.any(Number) },
        { numMessagesExist: 3, timeStamp: expect.any(Number) },
        { numMessagesExist: 2, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 0, timeStamp: expect.any(Number) }
      ]
    );
    expect(stats.utilizationRate).toStrictEqual(0);
  });

  test('message sent later', () => {
    const channelId = channelsCreateV2(tokens[0], 'Channel1', true).channelId;
    timeStart = Math.floor((new Date()).getTime() / 1000);
    messageSendLaterV1(tokens[0], channelId, 'message', timeStart + 2);
    expect(usersStatsV1(tokens[0]).workspaceStats.messagesExist).toStrictEqual(
      [
        { numMessagesExist: 0, timeStamp: expect.any(Number) }
      ]
    );
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2100);
    const stats = usersStatsV1(tokens[0]).workspaceStats;
    expect(stats.messagesExist).toStrictEqual(
      [
        { numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) }
      ]
    );
    expect(stats.utilizationRate).toStrictEqual(1 / 2);
  });

  test('shared message', () => {
    const channelId = channelsCreateV2(tokens[0], 'Channel1', true).channelId;
    const dmId = dmCreateV1(tokens[0], [uIds[1]]).dmId;
    const messageId = messageSendDmV1(tokens[0], dmId, 'dm message').messageId;
    messageShareV1(tokens[0], messageId, 'share to channel', channelId, -1);
    const stats = usersStatsV1(tokens[0]).workspaceStats;
    expect(stats.messagesExist).toStrictEqual(
      [
        { numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 2, timeStamp: expect.any(Number) }
      ]
    );
    expect(stats.utilizationRate).toStrictEqual(1);
  });

  test('standup message', () => {
    const channelId = channelsCreateV2(tokens[0], 'Channel1', true).channelId;
    channelInviteV2(tokens[0], channelId, uIds[1]);
    standupStartV1(tokens[0], channelId, 0.3);
    standupSendV1(tokens[0], channelId, 'a');
    standupSendV1(tokens[1], channelId, 'b');
    standupSendV1(tokens[1], channelId, 'c');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 450);
    expect(usersStatsV1(tokens[0]).workspaceStats.messagesExist).toStrictEqual(
      [
        { numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) }
      ]
    );
    expect(usersStatsV1(tokens[0]).workspaceStats.utilizationRate).toStrictEqual(1);
  });
});

test('timestamps', () => {
  const potentialDelay = 2;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  const timeStamp = Math.floor((new Date()).getTime() / 1000);
  const channelId = channelsCreateV2(tokens[0], 'Channel1', true).channelId;
  const dmId = dmCreateV1(tokens[0], [uIds[1]]).dmId;
  messageSendV1(tokens[0], channelId, 'channel message');
  messageSendDmV1(tokens[0], dmId, 'dm message');
  const stats = usersStatsV1(tokens[0]).workspaceStats;
  expect(stats.channelsExist[1].timeStamp).toBeGreaterThanOrEqual(timeStamp);
  expect(stats.channelsExist[1].timeStamp).toBeLessThanOrEqual(timeStamp + potentialDelay);
  expect(stats.dmsExist[1].timeStamp).toBeGreaterThanOrEqual(timeStamp);
  expect(stats.dmsExist[1].timeStamp).toBeLessThanOrEqual(timeStamp + potentialDelay);
  expect(stats.messagesExist[1].timeStamp).toBeGreaterThanOrEqual(timeStamp);
  expect(stats.messagesExist[1].timeStamp).toBeLessThanOrEqual(timeStamp + potentialDelay);
  expect(stats.messagesExist[2].timeStamp).toBeGreaterThanOrEqual(timeStamp);
  expect(stats.messagesExist[2].timeStamp).toBeLessThanOrEqual(timeStamp + potentialDelay);
  expect(stats.utilizationRate).toStrictEqual(1);
});
