import { authUserId, channelId, channelsList } from '../../interface';
import { authRegisterV3, channelsListAllV2, channelsCreateV2, clearV1 } from '../testHelperFunctions';

describe('error testing', () => {
  beforeEach(() => {
    clearV1();
  });

  test('invalid token, no existing tokens', () => {
    expect(channelsListAllV2('asd')).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('invalid token, 1 existing token', () => {
    const token1 = (authRegisterV3('jimjohnson@gmail.com', 'potato', 'Jim', 'Johnson') as authUserId).token;
    const invalidToken = token1 + 'a';
    expect(channelsListAllV2(invalidToken)).toStrictEqual({ code: 403, error: 'invalid token' });
  });
});

describe('correct returns', () => {
  beforeEach(() => {
    clearV1();
  });

  test('0 channels', () => {
    const token1 = (authRegisterV3('bobsatchel@gmail.com', 'password', 'Bob', 'Satchel') as authUserId).token;
    expect(channelsListAllV2(token1)).toStrictEqual({
      channels: []
    });
  });

  test('1 token creates 1 public channel', () => {
    const token1 = (authRegisterV3('jimjohnson@gmail.com', 'potato', 'Jim', 'Johnson') as authUserId).token;
    const channelId1 = (channelsCreateV2(token1, 'Channel1', true) as channelId).channelId;
    expect(channelsListAllV2(token1)).toStrictEqual({
      channels: [
        {
          channelId: channelId1,
          name: 'Channel1',
        }
      ]
    });
  });

  test('1 token creates 3 channels', () => {
    const token1 = (authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId).token;
    const channelId1 = (channelsCreateV2(token1, 'Channel1', true) as channelId).channelId;
    const channelId2 = (channelsCreateV2(token1, 'Channel2', true) as channelId).channelId;
    const channelId3 = (channelsCreateV2(token1, 'Channel3', false) as channelId).channelId;
    const list = new Set((channelsListAllV2(token1) as channelsList).channels);
    expect(list).toStrictEqual(new Set(
      [
        {
          channelId: channelId1,
          name: 'Channel1',
        },
        {
          channelId: channelId2,
          name: 'Channel2',
        },
        {
          channelId: channelId3,
          name: 'Channel3',
        }
      ]
    ));
  });

  test('1 token creates 3 channels, check using another id', () => {
    const token1 = (authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId).token;
    const channelId1 = (channelsCreateV2(token1, 'Channel1', true) as channelId).channelId;
    const channelId2 = (channelsCreateV2(token1, 'Channel2', true) as channelId).channelId;
    const channelId3 = (channelsCreateV2(token1, 'Channel3', false) as channelId).channelId;
    const token2 = (authRegisterV3('jefferyjohnson@gmail.com', 'password', 'Jeffery', 'Johnson') as authUserId).token;
    const list = new Set((channelsListAllV2(token2) as channelsList).channels);
    expect(list).toStrictEqual(new Set(
      [
        {
          channelId: channelId1,
          name: 'Channel1',
        },
        {
          channelId: channelId2,
          name: 'Channel2',
        },
        {
          channelId: channelId3,
          name: 'Channel3',
        },
      ]
    ));
  });

  test('2 token creates 2 channels, checks lists 2', () => {
    const token1 = (authRegisterV3('raypan@gmail.com', 'password', 'Ray', 'Pan') as authUserId).token;
    const token2 = (authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId).token;
    const channelId1 = (channelsCreateV2(token1, 'Channel1', true) as channelId).channelId;
    const channelId2 = (channelsCreateV2(token2, 'Channel2', true) as channelId).channelId;
    const list = new Set((channelsListAllV2(token1) as channelsList).channels);
    expect(list).toStrictEqual(new Set(
      [
        {
          channelId: channelId1,
          name: 'Channel1',
        },
        {
          channelId: channelId2,
          name: 'Channel2',
        },
      ]
    ));
  });
});
