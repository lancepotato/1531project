import { authUserId } from '../../interface';
import { authRegisterV3, channelDetailsV2, channelJoinV2, channelsCreateV2, clearV1 } from '../testHelperFunctions';

let user1: authUserId;
let user2: authUserId;

describe('success cases', () => {
  beforeEach(() => {
    clearV1();
    user1 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith');
    user2 = authRegisterV3('jsmith@gmail.com', 'password', 'J', 'Smith');
  });

  test('valid userid and channelid, channel is public', () => {
    const channel = channelsCreateV2(user1.token, 'channel', true);
    expect(channelJoinV2(user2.token, channel.channelId)).toStrictEqual({});
    const list: any = channelDetailsV2(user1.token, channel.channelId);
    list.allMembers = new Set(list.allMembers);
    expect(list).toStrictEqual(
      {
        name: 'channel',
        isPublic: true,
        ownerMembers: [
          {
            uId: user1.authUserId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          }
        ],
        allMembers: new Set([
          {
            uId: user1.authUserId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          },
          {
            uId: user2.authUserId,
            email: 'jsmith@gmail.com',
            nameFirst: 'J',
            nameLast: 'Smith',
            handleStr: 'jsmith',
            profileImgUrl: expect.any(String)
          }
        ])
      }
    );
  });
  test('channel is private and user is global owner', () => {
    const channel = channelsCreateV2(user2.token, 'channel', false);
    expect(channelJoinV2(user1.token, channel.channelId)).toStrictEqual({});
    const list: any = channelDetailsV2(user1.token, channel.channelId);
    list.allMembers = new Set(list.allMembers);
    expect(list).toStrictEqual(
      {
        name: 'channel',
        isPublic: false,
        ownerMembers: [
          {
            uId: user2.authUserId,
            email: 'jsmith@gmail.com',
            nameFirst: 'J',
            nameLast: 'Smith',
            handleStr: 'jsmith',
            profileImgUrl: expect.any(String)
          }
        ],
        allMembers: new Set([
          {
            uId: user2.authUserId,
            email: 'jsmith@gmail.com',
            nameFirst: 'J',
            nameLast: 'Smith',
            handleStr: 'jsmith',
            profileImgUrl: expect.any(String)
          },
          {
            uId: user1.authUserId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          }
        ])
      }
    );
  });
});

describe('error cases', () => {
  beforeEach(() => {
    clearV1();
    user1 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith');
  });
  test('user is already a member', () => {
    const channel = channelsCreateV2(user1.token, 'channel', true);
    expect(channelJoinV2(user1.token, channel.channelId)).toStrictEqual(
      { code: 400, error: 'User is already a member' }
    );
  });
  test('invalid channelId', () => {
    expect(channelJoinV2(user1.token, 1)).toStrictEqual(
      { code: 400, error: 'channelId is invalid' }
    );
  });
  test('channel is private and user is not global owner', () => {
    user2 = authRegisterV3('jsmith@gmail.com', 'password', 'J', 'Smith');
    const channel = channelsCreateV2(user1.token, 'channel', false);
    expect(channelJoinV2(user2.token, channel.channelId)).toStrictEqual(
      { code: 403, error: 'channel is private and user is not global owner' }
    );
  });
  test('token is invalid', () => {
    const channel = channelsCreateV2(user1.token, 'channel', true);
    const invalidToken = user1.token.concat('a');
    expect(channelJoinV2(invalidToken, channel.channelId)).toStrictEqual(
      { code: 403, error: 'token is invalid' }
    );
  });
});
