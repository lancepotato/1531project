import { authRegisterV3, dmCreateV1, dmDetailsV1, dmRemoveV1, dmLeaveV1, clearV1 } from '../testHelperFunctions';
import { authUserId } from '../../interface';

let user0: authUserId;
let user1: authUserId;
let uId1: number;
let token0: string;
let token1: string;
let dmId: number;

describe('error testing', () => {
  beforeEach(() => {
    clearV1();
    user0 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    token0 = user0.token;

    user1 = authRegisterV3('lancebai@hotmail.com', 'password1', 'Lance', 'Bai') as authUserId;
    uId1 = user1.authUserId;
    token1 = user1.token;

    dmId = dmCreateV1(token0, [uId1]).dmId;
  });

  test('invalid token', () => {
    const invalidToken = token0 + token1;
    expect(dmRemoveV1(invalidToken, dmId)).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('invalid dmId', () => {
    const invalidId = dmId + 1;
    expect(dmRemoveV1(token0, invalidId)).toStrictEqual({ code: 400, error: 'invalid dmId' });
  });

  test('token is not creator token', () => {
    expect(dmRemoveV1(token1, dmId)).toStrictEqual({ code: 403, error: 'token is not the original creator' });
  });

  test('token is not in the DM', () => {
    dmLeaveV1(token0, dmId);
    expect(dmRemoveV1(token0, dmId)).toStrictEqual({ code: 403, error: 'token is not in DM' });
  });
});

describe('successful returns', () => {
  beforeEach(() => {
    clearV1();
    user0 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    token0 = user0.token;
    dmId = dmCreateV1(token0, []).dmId;
  });

  test('returns empty object', () => {
    expect(dmRemoveV1(token0, dmId)).toStrictEqual({});
  });

  test('check DM has been removed', () => {
    const details = dmDetailsV1(token0, dmId);
    expect(details).toStrictEqual(
      {
        name: 'luigimario',
        members: [
          {
            email: 'luigimario@hotmail.com',
            handleStr: 'luigimario',
            nameFirst: 'Luigi',
            nameLast: 'Mario',
            uId: user0.authUserId,
            profileImgUrl: expect.any(String)
          }
        ]
      }
    );
    dmRemoveV1(token0, dmId);
    expect(dmDetailsV1(token0, dmId)).toStrictEqual({ code: 400, error: 'invalid dmId' });
  });
});
