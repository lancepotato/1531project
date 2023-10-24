import { authUserId, channelId } from '../../interface';
import { authRegisterV3, channelDetailsV2, channelInviteV2, channelJoinV2, channelsCreateV2, clearV1 } from '../testHelperFunctions';

let owner: authUserId;
let user: authUserId;
let ownerToken: string;
let ownerId: number;
let userToken: string;
let userId: number;
let chanId: number;
let outsideUser: authUserId;
let outsideUserToken: string;
let outsideUserId: number;

beforeEach(() => {
  clearV1();
  owner = authRegisterV3('authuserid@gmail.com', 'password', 'John', 'Smith') as authUserId;
  ownerToken = owner.token;
  ownerId = owner.authUserId;

  user = authRegisterV3('userid@gmail.com', '123456', 'Sally', 'Smith') as authUserId;
  userToken = user.token;
  userId = user.authUserId;

  outsideUser = (authRegisterV3('notowner@gmail.com', '12345678', 'Not', 'Owner') as authUserId);
  outsideUserToken = outsideUser.token;
  outsideUserId = outsideUser.authUserId;

  chanId = (channelsCreateV2(ownerToken, 'Channel 1', true) as channelId).channelId;
});

describe('error cases', () => {
  test('Invalid channelId - does not refer to a valid channel', () => {
    const invalidId = chanId + 1;
    const result = channelInviteV2(ownerToken, invalidId, userId);
    expect(result).toStrictEqual({ code: 400, error: 'invalid channelid' });
  });

  test('uId does not refer to a valid user', () => {
    const invalidId = ownerId + userId + outsideUserId + 1;
    const result = channelInviteV2(ownerToken, chanId, invalidId);
    expect(result).toStrictEqual({ code: 400, error: 'invalid userid' });
  });

  test('user invites themselves', () => {
    const result = channelInviteV2(ownerToken, chanId, ownerId);
    expect(result).toStrictEqual({ code: 400, error: 'user already in channel' });
  });

  test('uId refers to user who is already member of channel', () => {
    channelJoinV2(userToken, chanId);
    const result = channelInviteV2(ownerToken, chanId, userId);
    expect(result).toStrictEqual({ code: 400, error: 'user already in channel' });
  });

  test('valid channelId, auth user is not member of channel', () => {
    const result = channelInviteV2(outsideUserToken, chanId, userId);
    expect(result).toStrictEqual({ code: 403, error: 'token not a member' });
  });

  test('Invalid token', () => {
    const invalidToken = ownerToken + userToken + outsideUserToken;
    const result = channelInviteV2(invalidToken, chanId, userId);
    expect(result).toStrictEqual({ code: 403, error: 'invalid token' });
  });
});

test('Successful Case', () => {
  expect(channelInviteV2(ownerToken, chanId, userId)).toStrictEqual({});
  const details: any = channelDetailsV2(ownerToken, chanId);
  details.allMembers = new Set(details.allMembers);
  expect(details).toStrictEqual(
    {
      name: 'Channel 1',
      isPublic: true,
      ownerMembers: [
        {
          uId: ownerId,
          email: 'authuserid@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
          profileImgUrl: expect.any(String)
        }
      ],
      allMembers: new Set([
        {
          uId: ownerId,
          email: 'authuserid@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
          profileImgUrl: expect.any(String)
        },
        {
          uId: userId,
          email: 'userid@gmail.com',
          nameFirst: 'Sally',
          nameLast: 'Smith',
          handleStr: 'sallysmith',
          profileImgUrl: expect.any(String)
        }
      ])
    }
  );
});
