import { authUserId } from '../../interface';
import { authRegisterV3, userProfileV2, userProfileSetEmailV1, clearV1 } from '../testHelperFunctions';

let user: authUserId;

const user1OriginalEmail = 'jimjohnson@gmail.com';
const user2OriginalEmail = 'johnsmith@gmail.com';

beforeEach(() => {
  clearV1();
  user = authRegisterV3('jimjohnson@gmail.com', 'password1', 'Jim', 'Johnson');
});

describe('error cases', () => {
  test('Test when token is invalid', () => {
    const invalidToken = '';
    expect(userProfileSetEmailV1(invalidToken, user1OriginalEmail)).toStrictEqual({ code: 403, error: 'Invalid token' });
  });

  test('Test when email address is already being used by another user', () => {
    authRegisterV3('johnsmith@gmail.com', 'password2', 'John', 'Smith');
    expect(userProfileSetEmailV1(user.token, user2OriginalEmail)).toStrictEqual({ code: 400, error: 'email address is already being used' });
  });

  test('Test invalid email address', () => {
    const invalidEmail = 'jimjohnsongmail.com';
    expect(userProfileSetEmailV1(user.token, invalidEmail)).toStrictEqual({ code: 400, error: 'Invalid email address' });
  });
});

describe('success case', () => {
  test('Test success to update the email', () => {
    const email = 'jimjohnson11@gmail.com';
    userProfileSetEmailV1(user.token, email);
    expect(userProfileV2(user.token, user.authUserId)).toStrictEqual({
      user: {
        uId: user.authUserId,
        email: 'jimjohnson11@gmail.com',
        nameFirst: 'Jim',
        nameLast: 'Johnson',
        handleStr: 'jimjohnson',
        profileImgUrl: expect.any(String)
      }
    });
  });
});
