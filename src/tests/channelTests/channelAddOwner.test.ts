import { channelJoinV2, authRegisterV3, channelAddOwnerV1, channelsCreateV2, clearV1, authLogoutV2, channelDetailsV2 } from '../testHelperFunctions';

let owner;
let token: string;
let ownerId: number;
let channelId: number;
let otherUser;
let otherToken: string;
let otherId: number;

describe('/channel/addowner/v1', () => {
  beforeEach(() => {
    clearV1();
    owner = authRegisterV3('johnsmith@gmail.com', '12345678', 'John', 'Smith');
    token = owner.token;
    ownerId = owner.authUserId;
    channelId = channelsCreateV2(token, 'Channel', true).channelId;
    otherUser = authRegisterV3('otherperson@gmail.com', 'password', 'Other', 'Person');
    otherToken = otherUser.token;
    otherId = otherUser.authUserId;
  });

  test('Invalid token', () => {
    authLogoutV2(token);
    channelJoinV2(otherToken, channelId);
    const result = channelAddOwnerV1(token, channelId, otherId);
    expect(result).toEqual({ code: 403, error: 'Invalid token' });
  });

  test('Invalid channelId', () => {
    const invalidId = channelId + 1;
    const result = channelAddOwnerV1(token, invalidId, otherId);
    expect(result).toEqual({ code: 400, error: 'Invalid channelId' });
  });

  test('Invalid uId', () => {
    const invalidId = ownerId + otherId + 1;
    const result = channelAddOwnerV1(token, channelId, invalidId);
    expect(result).toEqual({ code: 400, error: 'Invalid uId' });
  });

  test('uId refers to user who is not member of channel', () => {
    const result = channelAddOwnerV1(token, channelId, otherId);
    expect(result).toEqual({ code: 400, error: 'User is not a member of channel' });
  });

  test('uId refers to user who is already owner of channel', () => {
    const result = channelAddOwnerV1(token, channelId, ownerId);
    expect(result).toEqual({ code: 400, error: 'User already owner' });
  });

  test('Auth user does not have owner permissions in channel', () => {
    const token2 = authRegisterV3('johnsmith2@gmail.com', '1234567', 'Jo', 'Smith2').token;
    channelJoinV2(otherToken, channelId);
    channelJoinV2(token2, channelId);
    const result = channelAddOwnerV1(token2, channelId, otherId);
    expect(result).toEqual({ code: 403, error: 'No owner permissions' });
  });

  test('Testing successful add owner', () => {
    channelJoinV2(otherToken, channelId);
    const result = channelAddOwnerV1(token, channelId, otherId);
    expect(result).toStrictEqual({});
    const details = channelDetailsV2(token, channelId);
    details.ownerMembers = new Set(details.ownerMembers);
    details.allMembers = new Set(details.allMembers);
    expect(details).toStrictEqual(
      {
        name: 'Channel',
        isPublic: true,
        ownerMembers: new Set([
          {
            uId: ownerId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          },
          {
            uId: otherId,
            email: 'otherperson@gmail.com',
            nameFirst: 'Other',
            nameLast: 'Person',
            handleStr: 'otherperson',
            profileImgUrl: expect.any(String)
          }
        ]),
        allMembers: new Set([
          {
            uId: ownerId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          },
          {
            uId: otherId,
            email: 'otherperson@gmail.com',
            nameFirst: 'Other',
            nameLast: 'Person',
            handleStr: 'otherperson',
            profileImgUrl: expect.any(String)
          }
        ]),
      });
  });
});

describe('edge cases', () => {
  beforeEach(() => {
    clearV1();
    owner = authRegisterV3('johnsmith@gmail.com', '12345678', 'John', 'Smith');
    token = owner.token;
    ownerId = owner.authUserId;
    otherUser = authRegisterV3('otherperson@gmail.com', 'password', 'Other', 'Person');
    otherToken = otherUser.token;
    otherId = otherUser.authUserId;
  });

  test('user is not channel owner, but is the global owner', () => {
    const channelId = channelsCreateV2(otherToken, 'Channel', true).channelId;
    channelJoinV2(token, channelId);
    const newUser = authRegisterV3('newperson@gmail.com', 'password', 'New', 'Person');
    const newUserToken = newUser.token;
    const newUserId = newUser.authUserId;
    channelJoinV2(newUserToken, channelId);
    expect(channelAddOwnerV1(token, channelId, newUserId)).toStrictEqual({});
    const result = channelDetailsV2(token, channelId);
    result.ownerMembers = new Set(result.ownerMembers);
    result.allMembers = new Set(result.allMembers);
    expect(result).toStrictEqual(
      {
        name: 'Channel',
        isPublic: true,
        ownerMembers: new Set([
          {
            uId: otherId,
            email: 'otherperson@gmail.com',
            nameFirst: 'Other',
            nameLast: 'Person',
            handleStr: 'otherperson',
            profileImgUrl: expect.any(String)
          },
          {
            uId: newUserId,
            email: 'newperson@gmail.com',
            nameFirst: 'New',
            nameLast: 'Person',
            handleStr: 'newperson',
            profileImgUrl: expect.any(String)
          }
        ]),
        allMembers: new Set([
          {
            uId: otherId,
            email: 'otherperson@gmail.com',
            nameFirst: 'Other',
            nameLast: 'Person',
            handleStr: 'otherperson',
            profileImgUrl: expect.any(String)
          },
          {
            uId: newUserId,
            email: 'newperson@gmail.com',
            nameFirst: 'New',
            nameLast: 'Person',
            handleStr: 'newperson',
            profileImgUrl: expect.any(String)
          },
          {
            uId: ownerId,
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
