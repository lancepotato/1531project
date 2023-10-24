import { authUserId } from '../../interface';
import { authRegisterV3, channelDetailsV2, channelsCreateV2, clearV1 } from '../testHelperFunctions';

let user: authUserId;

beforeEach(() => {
  clearV1();
  user = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith');
});

describe('success case', () => {
  test('valid token and channelId, public', () => {
    const channel = channelsCreateV2(user.token, 'channel', true);
    expect(channelDetailsV2(user.token, channel.channelId)).toStrictEqual(
      {
        name: 'channel',
        isPublic: true,
        ownerMembers: [
          {
            uId: user.authUserId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          }
        ],
        allMembers: [
          {
            uId: user.authUserId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          }
        ]
      }
    );
  });
  test('valid token and channelId, private', () => {
    const channel = channelsCreateV2(user.token, 'channel', false);
    expect(channelDetailsV2(user.token, channel.channelId)).toStrictEqual(
      {
        name: 'channel',
        isPublic: false,
        ownerMembers: [
          {
            uId: user.authUserId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          }
        ],
        allMembers: [
          {
            uId: user.authUserId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          }
        ]
      }
    );
  });
});
describe('error cases', () => {
  test('invalid channelId', () => {
    expect(channelDetailsV2(user.token, 1)).toStrictEqual(
      { code: 400, error: 'channelId is invalid' }
    );
  });
  test('valid channelId, user is not a member', () => {
    const user2 = authRegisterV3('jsmith@gmail.com', 'password', 'J', 'Smith');
    const channel = channelsCreateV2(user.token, 'channel', true);
    expect(channelDetailsV2(user2.token, channel.channelId)).toStrictEqual(
      { code: 403, error: 'User is not a member of channel' }
    );
  });
  test('token is invalid', () => {
    const channel = channelsCreateV2(user.token, 'channel', true);
    const invalidToken = user.token.concat('a');
    expect(channelDetailsV2(invalidToken, channel.channelId)).toStrictEqual(
      { code: 403, error: 'token is invalid' }
    );
  });
});
