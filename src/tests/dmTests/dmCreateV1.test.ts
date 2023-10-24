import { authRegisterV3, clearV1, dmCreateV1, dmDetailsV1 } from '../testHelperFunctions';
import { authUserId } from '../../interface';

let user0: authUserId;
let user1: authUserId;
let user2: authUserId;
let user3: authUserId;
let token0: string;
let uId1: number;
let uId2: number;
let uId3: number;
let uIds: number[];

describe('error testing', () => {
  beforeEach(() => {
    clearV1();
    user0 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    token0 = user0.token;

    user1 = authRegisterV3('lancebai@hotmail.com', 'password1', 'Lance', 'Bai') as authUserId;
    uId1 = user1.authUserId;

    user2 = authRegisterV3('jimjohnson@gmail.com', 'password2', 'Jim', 'Johnson') as authUserId;
    uId2 = user2.authUserId;

    user3 = authRegisterV3('johnsmith@gmail.com', 'password3', 'John', 'Smith') as authUserId;
    uId3 = user3.authUserId;

    uIds = [uId1, uId2, uId3];
  });

  test('invalid uId in uId array', () => {
    const invalidId = uId1 + 5;
    uIds.push(invalidId);
    expect(dmCreateV1(token0, uIds)).toStrictEqual({ code: 400, error: 'invalid uId' });
  });

  test('duplicate uIds in uId array', () => {
    uIds.push(uId1);
    expect(dmCreateV1(token0, uIds)).toStrictEqual({ code: 400, error: 'duplicate uIds given' });
  });

  test('invalid token', () => {
    const invalidToken = token0 + 'a';
    expect(dmCreateV1(invalidToken, uIds)).toStrictEqual({ code: 403, error: 'invalid token' });
  });
});

describe('successful returns', () => {
  beforeEach(() => {
    clearV1();
    user0 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;
    token0 = user0.token;

    user1 = authRegisterV3('lancebai@hotmail.com', 'password1', 'Lance', 'Bai') as authUserId;
    uId1 = user1.authUserId;

    user2 = authRegisterV3('jimjohnson@gmail.com', 'password2', 'Jim', 'Johnson') as authUserId;
    uId2 = user2.authUserId;

    user3 = authRegisterV3('johnsmith@gmail.com', 'password3', 'John', 'Smith') as authUserId;
    uId3 = user3.authUserId;

    uIds = [uId1, uId2, uId3];
  });

  test('returns dmId', () => {
    expect(dmCreateV1(token0, uIds)).toStrictEqual({ dmId: expect.any(Number) });
  });

  test('correct name, id, members array', () => {
    const dmId = dmCreateV1(token0, uIds).dmId;
    const details = dmDetailsV1(token0, dmId);
    expect(details.name).toStrictEqual('jimjohnson, johnsmith, lancebai, luigimario');
    const list = new Set(details.members);
    expect(list).toStrictEqual(new Set(
      [
        {
          email: 'lancebai@hotmail.com',
          handleStr: 'lancebai',
          nameFirst: 'Lance',
          nameLast: 'Bai',
          uId: uId1,
          profileImgUrl: expect.any(String)
        },
        {
          email: 'jimjohnson@gmail.com',
          handleStr: 'jimjohnson',
          nameFirst: 'Jim',
          nameLast: 'Johnson',
          uId: uId2,
          profileImgUrl: expect.any(String)
        },
        {
          email: 'johnsmith@gmail.com',
          handleStr: 'johnsmith',
          nameFirst: 'John',
          nameLast: 'Smith',
          uId: uId3,
          profileImgUrl: expect.any(String)
        },
        {
          email: 'luigimario@hotmail.com',
          handleStr: 'luigimario',
          nameFirst: 'Luigi',
          nameLast: 'Mario',
          uId: user0.authUserId,
          profileImgUrl: expect.any(String)
        }
      ]
    ));
  });
});

describe('edge cases', () => {
  beforeEach(() => {
    clearV1();
    token0 = (authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId).token;
    uIds = [];
  });

  test('empty uIds array', () => {
    const dmId = dmCreateV1(token0, uIds).dmId;
    expect(dmId).toStrictEqual(expect.any(Number));
    expect(dmDetailsV1(token0, dmId).name).toStrictEqual('luigimario');
  });
});
