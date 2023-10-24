import { authUserId, channelId, channelsList } from '../../interface';
import { authRegisterV3, channelsListV2, channelsCreateV2, channelJoinV2, clearV1 } from '../testHelperFunctions';

describe('error testing', () => {
  beforeEach(() => {
    clearV1();
  });

  test('invalid token, no existing tokens', () => {
    expect(channelsListV2('asd')).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('invalid token, 1 existing id in data', () => {
    const token1 = (authRegisterV3('jimjohnson@gmail.com', 'potato', 'Jim', 'Johnson') as authUserId).token;
    const invalidToken = token1 + 'a';
    expect(channelsListV2(invalidToken)).toStrictEqual({ code: 403, error: 'invalid token' });
  });
});

describe('correct returns', () => {
  beforeEach(() => {
    clearV1();
  });

  test('1 token creates 1 public channel', () => {
    const token1 = (authRegisterV3('jimjohnson@gmail.com', 'potato', 'Jim', 'Johnson') as authUserId).token;
    const channelId1 = (channelsCreateV2(token1, 'Channel1', true) as channelId).channelId;
    expect(channelsListV2(token1)).toStrictEqual({
      channels: [
        {
          channelId: channelId1,
          name: 'Channel1',
        }
      ]
    });
  });

  test('1 token creates 2 channels', () => {
    const token1 = (authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId).token;
    const channelId1 = (channelsCreateV2(token1, 'Channel1', true) as channelId).channelId;
    const channelId2 = (channelsCreateV2(token1, 'Channel2', false) as channelId).channelId;
    const list = new Set((channelsListV2(token1) as channelsList).channels);
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

  test('1 token creates 3 channels, another joins 1 channel', () => {
    const token1 = (authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith') as authUserId).token;
    const channelId2 = (channelsCreateV2(token1, 'Channel2', true) as channelId).channelId;
    const token2 = (authRegisterV3('jefferyjohnson@gmail.com', 'password', 'Jeffery', 'Johnson') as authUserId).token;
    channelJoinV2(token2, channelId2);
    expect(channelsListV2(token2)).toStrictEqual({
      channels: [
        {
          channelId: channelId2,
          name: 'Channel2',
        }
      ]
    });
  });
});
