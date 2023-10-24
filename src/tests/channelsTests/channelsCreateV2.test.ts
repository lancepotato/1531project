import { authRegisterV3, channelsCreateV2, clearV1, channelDetailsV2 } from '../testHelperFunctions';
import { authUserId, channelId } from '../../interface';

describe('error testing', () => {
  beforeEach(() => {
    clearV1();
  });

  test('invalid token, no existing', () => {
    expect(channelsCreateV2('asd', 'channel1', true)).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('invalid token, 1 token already exists', () => {
    const token1 = (authRegisterV3('jimjohnson@gmail.com', 'potato', 'Jim', 'Johnson') as authUserId).token;
    const invalidToken = token1 + 'a';
    expect(channelsCreateV2(invalidToken, 'Channel1', true)).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('length of name is less than 1', () => {
    const token1 = (authRegisterV3('jeffreyjohnson@gmail.com', 'potato', 'Jeffrey', 'Johnson') as authUserId).token;
    expect(channelsCreateV2(token1, '', false)).toStrictEqual({ code: 400, error: 'invalid name' });
  });

  test('length of name is greater than 20', () => {
    const token1 = (authRegisterV3('jeffreyjohnson@gmail.com', 'potato', 'Jeffrey', 'Johnson') as authUserId).token;
    expect(channelsCreateV2(token1, 'twentycharacterchannelname', true)).toStrictEqual({ code: 400, error: 'invalid name' });
  });
});

describe('correct returns', () => {
  beforeEach(() => {
    clearV1();
  });

  test('return value is correct (number)', () => {
    const token1 = (authRegisterV3('lawrencebai@gmail.com', 'password', 'Lawrence', 'Bai') as authUserId).token;
    expect(channelsCreateV2(token1, 'Channel1', true)).toStrictEqual(
      {
        channelId: expect.any(Number)
      }
    );
  });

  test('check data is created', () => {
    const user = (authRegisterV3('luigimario@gmail.com', 'password', 'Luigi', 'Mario') as authUserId);
    const token = user.token;
    const uId = user.authUserId;
    const channelId = (channelsCreateV2(token, 'Channel1', true) as channelId).channelId;
    expect(channelDetailsV2(token, channelId)).toStrictEqual(
      {
        name: 'Channel1',
        isPublic: true,
        ownerMembers: [
          {
            uId: uId,
            email: 'luigimario@gmail.com',
            nameFirst: 'Luigi',
            nameLast: 'Mario',
            handleStr: 'luigimario',
            profileImgUrl: expect.any(String)
          }
        ],
        allMembers: [
          {
            uId: uId,
            email: 'luigimario@gmail.com',
            nameFirst: 'Luigi',
            nameLast: 'Mario',
            handleStr: 'luigimario',
            profileImgUrl: expect.any(String)
          }
        ]
      }
    );
  });
});
