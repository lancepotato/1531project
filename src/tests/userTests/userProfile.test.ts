import { authUserId } from '../../interface';
import { authRegisterV3, userProfileV2, clearV1 } from '../testHelperFunctions';

let user1: authUserId;
let user2: authUserId;

beforeEach(() => {
  clearV1();
  user1 = authRegisterV3('jimjohnson@gmail.com', 'password1', 'Jim', 'Johnson');
});
describe('error cases', () => {
  test('Test when token is invalid', () => {
    const invalidToken = '';
    expect(userProfileV2(invalidToken, user1.authUserId)).toStrictEqual({ code: 403, error: 'Invalid token' });
  });

  test('Test when uId does not refer to a valid user', () => {
    const invalidUid = user1.authUserId + 1;
    expect(userProfileV2(user1.token, invalidUid)).toStrictEqual({ code: 400, error: 'Invalid uId' });
  });
});

describe('success cases', () => {
  test('Test a user\'s own profile', () => {
    expect(userProfileV2(user1.token, user1.authUserId)).toStrictEqual({
      user: {
        uId: user1.authUserId,
        email: 'jimjohnson@gmail.com',
        nameFirst: 'Jim',
        nameLast: 'Johnson',
        handleStr: 'jimjohnson',
        profileImgUrl: expect.any(String),
      }
    });
  });

  test('Test other users\' profile', () => {
    user2 = authRegisterV3('johnsmith@gmail.com', 'password2', 'John', 'Smith');
    expect(userProfileV2(user1.token, user2.authUserId)).toStrictEqual({
      user: {
        uId: user2.authUserId,
        email: 'johnsmith@gmail.com',
        nameFirst: 'John',
        nameLast: 'Smith',
        handleStr: 'johnsmith',
        profileImgUrl: expect.any(String),
      }
    });
  });
});
