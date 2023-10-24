import { authUserId } from '../../interface';
import { authRegisterV3, channelInviteV2, channelJoinV2, channelLeaveV1, channelsCreateV2, clearV1, dmCreateV1, dmLeaveV1, dmRemoveV1, messageEditV1, messageRemoveV1, messageSendDmV1, messageSendLaterDmV1, messageSendLaterV1, messageSendV1, messageShareV1, standupSendV1, standupStartV1, userStatsV1 } from '../testHelperFunctions';

let user1: authUserId;
let user2: authUserId;
let channelId: number;
let dmId: number;
let messageId: number;
let timeStart: number;

beforeEach(() => {
  clearV1();
  timeStart = Math.floor((new Date()).getTime() / 1000);
  user1 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
  user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId;
});

describe('error cases', () => {
  test('invalid token', () => {
    expect(userStatsV1(user1.token + 'a')).toStrictEqual({ code: 403, error: 'invalid token' });
  });
});

describe('channel cases', () => {
  test('channelCreate increase', () => {
    channelsCreateV2(user1.token, 'Channel1', true);
    expect(userStatsV1(user1.token).userStats.channelsJoined).toStrictEqual(
      [
        { numChannelsJoined: 0, timeStamp: expect.any(Number) },
        { numChannelsJoined: 1, timeStamp: expect.any(Number) },
      ]
    );
  });
  test('channelJoin increase', () => {
    channelId = channelsCreateV2(user2.token, 'Channel1', true).channelId;
    channelJoinV2(user1.token, channelId);
    expect(userStatsV1(user1.token).userStats.channelsJoined).toStrictEqual(
      [
        { numChannelsJoined: 0, timeStamp: expect.any(Number) },
        { numChannelsJoined: 1, timeStamp: expect.any(Number) },
      ]
    );
  });
  test('channelInvite increase', () => {
    channelId = channelsCreateV2(user2.token, 'Channel1', true).channelId;
    channelInviteV2(user2.token, channelId, user1.authUserId);
    expect(userStatsV1(user1.token).userStats.channelsJoined).toStrictEqual(
      [
        { numChannelsJoined: 0, timeStamp: expect.any(Number) },
        { numChannelsJoined: 1, timeStamp: expect.any(Number) },
      ]
    );
  });
  test('channelLeave decrease', () => {
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
    channelLeaveV1(user1.token, channelId);
    expect(userStatsV1(user1.token).userStats.channelsJoined).toStrictEqual(
      [
        { numChannelsJoined: 0, timeStamp: expect.any(Number) },
        { numChannelsJoined: 1, timeStamp: expect.any(Number) },
        { numChannelsJoined: 0, timeStamp: expect.any(Number) },
      ]
    );
  });
});

describe('dm cases', () => {
  test('dmCreate increase', () => {
    dmCreateV1(user1.token, [user2.authUserId]);
    expect(userStatsV1(user1.token).userStats.dmsJoined).toStrictEqual(
      [
        { numDmsJoined: 0, timeStamp: expect.any(Number) },
        { numDmsJoined: 1, timeStamp: expect.any(Number) },
      ]
    );
    expect(userStatsV1(user2.token).userStats.dmsJoined).toStrictEqual(
      [
        { numDmsJoined: 0, timeStamp: expect.any(Number) },
        { numDmsJoined: 1, timeStamp: expect.any(Number) },
      ]
    );
  });
  test('dmLeave decrease', () => {
    dmId = dmCreateV1(user1.token, []).dmId;
    dmLeaveV1(user1.token, dmId);
    expect(userStatsV1(user1.token).userStats.dmsJoined).toStrictEqual(
      [
        { numDmsJoined: 0, timeStamp: expect.any(Number) },
        { numDmsJoined: 1, timeStamp: expect.any(Number) },
        { numDmsJoined: 0, timeStamp: expect.any(Number) },
      ]
    );
  });
  test('dmRemove decrease', () => {
    dmId = dmCreateV1(user1.token, [user2.authUserId]).dmId;
    dmRemoveV1(user1.token, dmId);
    expect(userStatsV1(user1.token).userStats.dmsJoined).toStrictEqual(
      [
        { numDmsJoined: 0, timeStamp: expect.any(Number) },
        { numDmsJoined: 1, timeStamp: expect.any(Number) },
        { numDmsJoined: 0, timeStamp: expect.any(Number) },
      ]
    );
    expect(userStatsV1(user2.token).userStats.dmsJoined).toStrictEqual(
      [
        { numDmsJoined: 0, timeStamp: expect.any(Number) },
        { numDmsJoined: 1, timeStamp: expect.any(Number) },
        { numDmsJoined: 0, timeStamp: expect.any(Number) },
      ]
    );
  });
});

describe('messages cases', () => {
  test('messageSend increase', () => {
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
    messageSendV1(user1.token, channelId, 'message');
    expect(userStatsV1(user1.token).userStats.messagesSent).toStrictEqual(
      [
        { numMessagesSent: 0, timeStamp: expect.any(Number) },
        { numMessagesSent: 1, timeStamp: expect.any(Number) },
      ]
    );
  });
  test('messageSendLater increase', () => {
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
    const timeSent = Math.floor((new Date()).getTime() / 1000) + 2;
    messageSendLaterV1(user1.token, channelId, 'message', timeSent);
    expect(userStatsV1(user1.token).userStats.messagesSent).toStrictEqual(
      [
        { numMessagesSent: 0, timeStamp: expect.any(Number) }
      ]);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2500);
    expect(userStatsV1(user1.token).userStats.messagesSent).toStrictEqual(
      [
        { numMessagesSent: 0, timeStamp: expect.any(Number) },
        { numMessagesSent: 1, timeStamp: expect.any(Number) },
      ]
    );
  });
  test('messageSendDm increase', () => {
    dmId = dmCreateV1(user1.token, []).dmId;
    messageSendDmV1(user1.token, dmId, 'message');
    expect(userStatsV1(user1.token).userStats.messagesSent).toStrictEqual(
      [
        { numMessagesSent: 0, timeStamp: expect.any(Number) },
        { numMessagesSent: 1, timeStamp: expect.any(Number) },
      ]
    );
  });
  test('messageSendLaterDm increase', () => {
    dmId = dmCreateV1(user1.token, []).dmId;
    const timeSent = Math.floor((new Date()).getTime() / 1000) + 2;
    messageSendLaterDmV1(user1.token, dmId, 'message', timeSent);
    expect(userStatsV1(user1.token).userStats.messagesSent).toStrictEqual(
      [
        { numMessagesSent: 0, timeStamp: expect.any(Number) }
      ]);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2500);
    expect(userStatsV1(user1.token).userStats.messagesSent).toStrictEqual(
      [
        { numMessagesSent: 0, timeStamp: expect.any(Number) },
        { numMessagesSent: 1, timeStamp: expect.any(Number) },
      ]
    );
  });
  test('messageEdit non empty message does nothing', () => {
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
    messageId = messageSendV1(user1.token, channelId, 'message').messageId;
    messageEditV1(user1.token, messageId, 'change');
    expect(userStatsV1(user1.token).userStats.messagesSent).toStrictEqual(
      [
        { numMessagesSent: 0, timeStamp: expect.any(Number) },
        { numMessagesSent: 1, timeStamp: expect.any(Number) },
      ]
    );
  });
  test('messageEdit empty message does nothing', () => {
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
    messageId = messageSendV1(user1.token, channelId, 'message').messageId;
    messageEditV1(user1.token, messageId, 'change');
    expect(userStatsV1(user1.token).userStats.messagesSent).toStrictEqual(
      [
        { numMessagesSent: 0, timeStamp: expect.any(Number) },
        { numMessagesSent: 1, timeStamp: expect.any(Number) },
      ]
    );
  });
  test('messageRemove does nothing', () => {
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
    messageId = messageSendV1(user1.token, channelId, 'message').messageId;
    messageEditV1(user1.token, messageId, 'change');
    expect(userStatsV1(user1.token).userStats.messagesSent).toStrictEqual(
      [
        { numMessagesSent: 0, timeStamp: expect.any(Number) },
        { numMessagesSent: 1, timeStamp: expect.any(Number) },
      ]
    );
  });
  test('messageShare increase', () => {
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
    const channelId2 = channelsCreateV2(user1.token, 'Channel2', true).channelId;
    const ogMessageId = messageSendV1(user1.token, channelId2, 'message').messageId;
    messageShareV1(user1.token, ogMessageId, 'hello', channelId, -1);
    expect(userStatsV1(user1.token).userStats.messagesSent).toStrictEqual(
      [
        { numMessagesSent: 0, timeStamp: expect.any(Number) },
        { numMessagesSent: 1, timeStamp: expect.any(Number) },
        { numMessagesSent: 2, timeStamp: expect.any(Number) },
      ]
    );
  });
  test('multiple standupSend only increases standup starter once', () => {
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
    channelJoinV2(user2.token, channelId);
    standupStartV1(user1.token, channelId, 0.3);
    standupSendV1(user1.token, channelId, 'a');
    standupSendV1(user1.token, channelId, 'b');
    standupSendV1(user2.token, channelId, 'c');
    standupSendV1(user2.token, channelId, 'd');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 450);
    expect(userStatsV1(user1.token).userStats.messagesSent).toStrictEqual(
      [
        { numMessagesSent: 0, timeStamp: expect.any(Number) },
        { numMessagesSent: 1, timeStamp: expect.any(Number) },
      ]
    );
    expect(userStatsV1(user2.token).userStats.messagesSent).toStrictEqual(
      [
        { numMessagesSent: 0, timeStamp: expect.any(Number) },
      ]
    );
  });
});

describe('involvement rate ', () => {
  test('denominator is 0, (0+0+1)/(0+0+0)', () => {
    dmId = dmCreateV1(user1.token, []).dmId;
    messageSendDmV1(user1.token, dmId, '1');
    dmRemoveV1(user1.token, dmId);
    expect(userStatsV1(user1.token).userStats.involvementRate).toStrictEqual(0);
  });
  test('involvement is capped at 1, (0+1+1)/(0+1+0)', () => {
    dmId = dmCreateV1(user1.token, []).dmId;
    messageId = messageSendDmV1(user1.token, dmId, '1').messageId;
    messageRemoveV1(user1.token, messageId);
    expect(userStatsV1(user1.token).userStats.involvementRate).toStrictEqual(1);
  });
  test('involvement is calculated correctly, (0+1+1)/(1+1+1)', () => {
    dmId = dmCreateV1(user1.token, []).dmId;
    messageId = messageSendDmV1(user1.token, dmId, '1').messageId;
    channelId = channelsCreateV2(user2.token, 'Channel1', true).channelId;
    expect(userStatsV1(user1.token).userStats.involvementRate).toStrictEqual(2 / 3);
  });
});

describe('timeStamp', () => {
  test('check timeStamp is correct', () => {
    const potentialDelay = 2;
    expect(userStatsV1(user1.token).userStats.channelsJoined[0].timeStamp).toBeGreaterThanOrEqual(timeStart);
    expect(userStatsV1(user1.token).userStats.channelsJoined[0].timeStamp).toBeLessThanOrEqual(timeStart + potentialDelay);
    expect(userStatsV1(user1.token).userStats.dmsJoined[0].timeStamp).toBeGreaterThanOrEqual(timeStart);
    expect(userStatsV1(user1.token).userStats.dmsJoined[0].timeStamp).toBeLessThanOrEqual(timeStart + potentialDelay);
    expect(userStatsV1(user1.token).userStats.messagesSent[0].timeStamp).toBeGreaterThanOrEqual(timeStart);
    expect(userStatsV1(user1.token).userStats.messagesSent[0].timeStamp).toBeLessThanOrEqual(timeStart + potentialDelay);

    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    channelId = channelsCreateV2(user1.token, 'Channel1', true).channelId;
    const user3 = authRegisterV3('jsmith@gmail.com', 'password', 'J', 'Smith') as authUserId;
    dmCreateV1(user1.token, []);
    messageSendV1(user1.token, channelId, 'hi');
    const stats1 = userStatsV1(user1.token).userStats;
    expect(stats1.channelsJoined[1].timeStamp).toBeGreaterThanOrEqual(timeStart + 1);
    expect(stats1.channelsJoined[1].timeStamp).toBeLessThanOrEqual(timeStart + 1 + potentialDelay);
    expect(stats1.dmsJoined[1].timeStamp).toBeGreaterThanOrEqual(timeStart + 1);
    expect(stats1.dmsJoined[1].timeStamp).toBeLessThanOrEqual(timeStart + 1 + potentialDelay);
    expect(stats1.messagesSent[1].timeStamp).toBeGreaterThanOrEqual(timeStart + 1);
    expect(stats1.messagesSent[1].timeStamp).toBeLessThanOrEqual(timeStart + 1 + potentialDelay);
    const stats3 = userStatsV1(user3.token).userStats;
    expect(stats3.channelsJoined[0].timeStamp).toBeGreaterThanOrEqual(timeStart + 1);
    expect(stats3.channelsJoined[0].timeStamp).toBeLessThanOrEqual(timeStart + 1 + potentialDelay);
    expect(stats3.dmsJoined[0].timeStamp).toBeGreaterThanOrEqual(timeStart + 1);
    expect(stats3.dmsJoined[0].timeStamp).toBeLessThanOrEqual(timeStart + 1 + potentialDelay);
    expect(stats3.messagesSent[0].timeStamp).toBeGreaterThanOrEqual(timeStart + 1);
    expect(stats3.messagesSent[0].timeStamp).toBeLessThanOrEqual(timeStart + 1 + potentialDelay);
  });
});
