import { authRegisterV3, channelsCreateV2, clearV1, authLogoutV2, channelLeaveV1, channelDetailsV2, channelJoinV2, standupStartV1 } from '../testHelperFunctions';

describe('/channel/leave tests', () => {
  let token: string;
  let channelId: number;

  beforeEach(() => {
    clearV1();
    token = authRegisterV3('johnsmith@gmail.com', '12345678', 'John', 'Smith').token;
    channelId = channelsCreateV2(token, 'Channel', true).channelId;
  });

  test('Invalid token', () => {
    authLogoutV2(token);
    const result = channelLeaveV1(token, channelId);
    expect(result).toEqual({ code: 403, error: 'invalid token' });
  });

  test('Invalid channelId', () => {
    const result = channelLeaveV1(token, 500);
    expect(result).toEqual({ code: 400, error: 'invalid channelId' });
  });

  test('Authorised user not a member of channel', () => {
    const invalid = authRegisterV3('invalid@gmail.com', '1234567', 'Invalid', 'User').token;
    const result = channelLeaveV1(invalid, channelId);
    expect(result).toEqual({ code: 403, error: 'User is not a member of channel' });
  });

  test('AuthUser starter of active standup', () => {
    standupStartV1(token, channelId, 0.2);
    const result = channelLeaveV1(token, channelId);
    expect(result).toEqual({ code: 400, error: 'AuthUser starter of active standup' });
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
  });

  test('Testing successful leave channel', () => {
    const result = channelLeaveV1(token, channelId);
    expect(result).toStrictEqual({});
    expect(channelLeaveV1(token, channelId)).toEqual({ code: 403, error: 'User is not a member of channel' });
  });

  test('Testing successful leave channel - multiple members', () => {
    const user = authRegisterV3('johnsmith1@gmail.com', '12345678', 'john', 'smith');
    channelJoinV2(user.token, channelId);
    const result = channelLeaveV1(token, channelId);
    expect(result).toStrictEqual({});
    expect(channelLeaveV1(token, channelId)).toEqual({ code: 403, error: 'User is not a member of channel' });
    expect(channelDetailsV2(user.token, channelId)).toStrictEqual(
      {
        name: 'Channel',
        isPublic: true,
        ownerMembers: [],
        allMembers: [
          {
            uId: user.authUserId,
            email: 'johnsmith1@gmail.com',
            nameFirst: 'john',
            nameLast: 'smith',
            handleStr: 'johnsmith0',
            profileImgUrl: expect.any(String),
          }
        ]
      }
    );
  });
});
