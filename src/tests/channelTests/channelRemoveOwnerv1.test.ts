import { authUserId } from '../../interface';
import { authRegisterV3, channelJoinV2, channelsCreateV2, clearV1, channelRemoveOwnerV1, authLogoutV2, channelAddOwnerV1, channelDetailsV2 } from '../testHelperFunctions';

describe('/channel/removeowner/v1', () => {
  let token: string;
  let channelId: number;
  let owner: authUserId;

  beforeEach(() => {
    clearV1();
    owner = authRegisterV3('johnsmith@gmail.com', '12345678', 'John', 'Smith');
    token = owner.token;
    channelId = channelsCreateV2(token, 'Channel', true).channelId;
  });

  test('Invalid token', () => {
    authLogoutV2(token);
    const result = channelRemoveOwnerV1(token, channelId, 1);
    expect(result).toEqual({ code: 403, error: 'Invalid token' });
  });

  test('Invalid channel', () => {
    const result = channelRemoveOwnerV1(token, channelId + 1, 1);
    expect(result).toEqual({ code: 400, error: 'Invalid channelId' });
  });

  test('Invalid uID', () => {
    const result = channelRemoveOwnerV1(token, channelId, owner.authUserId + 1);
    expect(result).toEqual({ code: 400, error: 'Invalid uId' });
  });

  test('uId refers to user who is not owner of channel', () => {
    const invalid = authRegisterV3('invalid@gmail.com', '1234567', 'Invalid', 'Token');
    channelJoinV2(invalid.token, channelId);
    const result = channelRemoveOwnerV1(token, channelId, invalid.authUserId);
    expect(result).toEqual({ code: 400, error: 'uId not owner' });
  });

  test('uId refers to a user who is currently the only owner of the channel', () => {
    const result = channelRemoveOwnerV1(token, channelId, owner.authUserId);
    expect(result).toEqual({ code: 400, error: 'Only one owner' });
  });

  test('Auth user does not have owner permissions in channel', () => {
    const token2 = authRegisterV3('johnsmith2@gmail.com', '1234567', 'Jo', 'Smith2').token;
    channelJoinV2(token2, channelId);
    const result = channelRemoveOwnerV1(token2, channelId, owner.authUserId);
    expect(result).toEqual({ code: 403, error: 'No owner permissions' });
  });

  test('Testing successful remove owner', () => {
    const user = authRegisterV3('johnsmith2@gmail.com', '1234567', 'Jo', 'Smith2');
    channelJoinV2(user.token, channelId);
    channelAddOwnerV1(token, channelId, user.authUserId);
    const detail = channelDetailsV2(token, channelId);
    detail.ownerMembers = new Set(detail.ownerMembers);
    detail.allMembers = new Set(detail.allMembers);
    expect(detail).toStrictEqual(
      {
        name: 'Channel',
        isPublic: true,
        ownerMembers: new Set([
          {
            uId: owner.authUserId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          },
          {
            uId: user.authUserId,
            email: 'johnsmith2@gmail.com',
            nameFirst: 'Jo',
            nameLast: 'Smith2',
            handleStr: 'josmith2',
            profileImgUrl: expect.any(String)
          }
        ]),
        allMembers: new Set([
          {
            uId: owner.authUserId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          },
          {
            uId: user.authUserId,
            email: 'johnsmith2@gmail.com',
            nameFirst: 'Jo',
            nameLast: 'Smith2',
            handleStr: 'josmith2',
            profileImgUrl: expect.any(String)
          }
        ])
      }
    );
    const result = channelRemoveOwnerV1(token, channelId, user.authUserId);
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
            uId: owner.authUserId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          }
        ]),
        allMembers: new Set([
          {
            uId: owner.authUserId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          },
          {
            uId: user.authUserId,
            email: 'johnsmith2@gmail.com',
            nameFirst: 'Jo',
            nameLast: 'Smith2',
            handleStr: 'josmith2',
            profileImgUrl: expect.any(String)
          }
        ])
      }
    );
  });
});
