import { authRegisterV3, dmCreateV1, dmDetailsV1, dmLeaveV1, clearV1 } from '../testHelperFunctions';
import { authUserId } from '../../interface';

let user0: authUserId;
let token0: string;
let uId0: number;
let user1: authUserId;
let token1: string;
let uId1: number;
let user2: authUserId;
let dmId: number;

describe('error testing', () => {
  beforeEach(() => {
    clearV1();
    user0 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    token0 = user0.token;
    uId0 = user0.authUserId;

    user1 = authRegisterV3('lancebai@hotmail.com', 'password1', 'Lance', 'Bai') as authUserId;
    token1 = user1.token;
    uId1 = user1.authUserId;

    dmId = dmCreateV1(token0, [uId1]).dmId;
  });

  test('invalid token', () => {
    const invalidToken = token0 + token1;
    expect(dmLeaveV1(invalidToken, dmId)).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('invalid dmId', () => {
    const invalidId = uId0 + uId1 + 1;
    expect(dmLeaveV1(token1, invalidId)).toStrictEqual({ code: 400, error: 'invalid dmId' });
  });

  test('token is not part of DM', () => {
    user2 = authRegisterV3('jimjohnson@gmail.com', 'password2', 'Jim', 'Johnson') as authUserId;
    expect(dmLeaveV1(user2.token, dmId)).toStrictEqual({ code: 403, error: 'member is not in DM' });
  });
});

describe('successful returns', () => {
  beforeEach(() => {
    clearV1();
    user0 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    token0 = user0.token;
    uId0 = user0.authUserId;

    user1 = authRegisterV3('lancebai@hotmail.com', 'password1', 'Lance', 'Bai') as authUserId;
    token1 = user1.token;
    uId1 = user1.authUserId;

    dmId = dmCreateV1(token0, [uId1]).dmId;
  });

  test('returns empty object', () => {
    expect(dmLeaveV1(token1, dmId)).toStrictEqual({});
  });

  test('normal member leaves DM', () => {
    dmLeaveV1(token1, dmId);
    expect(dmDetailsV1(token0, dmId)).toStrictEqual(
      {
        name: 'lancebai, luigimario',
        members: [
          {
            email: 'luigimario@hotmail.com',
            handleStr: 'luigimario',
            nameFirst: 'Luigi',
            nameLast: 'Mario',
            uId: 0,
            profileImgUrl: expect.any(String)
          }
        ]
      }
    );
    expect(dmDetailsV1(token1, dmId)).toStrictEqual({ code: 403, error: 'user is not a member of dm' });
  });
});
