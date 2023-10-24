import { authUserId } from '../../interface';
import { authRegisterV3, clearV1, dmCreateV1, dmDetailsV1 } from '../testHelperFunctions';

let user1: authUserId;
let user2: authUserId;
let dmId: number;

beforeEach(() => {
  clearV1();
  user1 = authRegisterV3('jimjohnson@gmail.com', 'password2', 'Jim', 'Johnson');
  user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith');
  dmId = dmCreateV1(user1.token, [user2.authUserId]).dmId;
});

describe('success case', () => {
  test('valid dmId and user is a member', () => {
    const list = dmDetailsV1(user1.token, dmId);
    list.members = new Set(list.members);
    expect(list).toStrictEqual(
      {
        name: 'jimjohnson, johnsmith',
        members: new Set([
          {
            uId: user2.authUserId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: expect.any(String)
          },
          {
            uId: user1.authUserId,
            email: 'jimjohnson@gmail.com',
            nameFirst: 'Jim',
            nameLast: 'Johnson',
            handleStr: 'jimjohnson',
            profileImgUrl: expect.any(String)
          }
        ])
      }
    );
  });
});

describe('error cases', () => {
  test('token is invalid', () => {
    const invalidToken = '';
    expect(dmDetailsV1(invalidToken, dmId)).toStrictEqual(
      { code: 403, error: 'invalid token' }
    );
  });
  test('dmId is invalid', () => {
    expect(dmDetailsV1(user1.token, dmId + 1)).toStrictEqual(
      { code: 400, error: 'invalid dmId' }
    );
  });
  test('valid dmId and user is not a member', () => {
    const user3 = authRegisterV3('jsmith@gmail.com', 'password', 'J', 'Smith');
    expect(dmDetailsV1(user3.token, dmId)).toStrictEqual(
      { code: 403, error: 'user is not a member of dm' }
    );
  });
});
