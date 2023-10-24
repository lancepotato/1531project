import { authUserId } from '../../interface';
import { authRegisterV3, userProfileV2, userProfileSetHandleV1, clearV1 } from '../testHelperFunctions';

let user1: authUserId;

const user1OriginalHandle = 'jimjohnson';
const user2OriginalHandle = 'johnsmith';

beforeEach(() => {
  clearV1();
  user1 = authRegisterV3('jimjohnson@gmail.com', 'password1', 'Jim', 'Johnson');
});

describe('error cases', () => {
  test('Test when token is invalid', () => {
    const invalidToken = '';
    expect(userProfileSetHandleV1(invalidToken, user1OriginalHandle)).toStrictEqual({ code: 403, error: 'Invalid token' });
  });

  test('Test when length of handleStr is over 20 characters', () => {
    const invalidHandle = 'jimjohnsonjimjohnsonjimjohnson';
    expect(userProfileSetHandleV1(user1.token, invalidHandle)).toStrictEqual({ code: 400, error: 'Invalid handleStr' });
  });

  test('Test when length of handleStr is less than 3 characterss', () => {
    const invalidHandle = 'j';
    expect(userProfileSetHandleV1(user1.token, invalidHandle)).toStrictEqual({ code: 400, error: 'Invalid handleStr' });
  });

  test('Test when handle is already being used by another user', () => {
    authRegisterV3('johnsmith@gmail.com', 'password2', 'John', 'Smith');
    expect(userProfileSetHandleV1(user1.token, user2OriginalHandle)).toStrictEqual({ code: 400, error: 'handle is already being used' });
  });

  test('Test when handle contains characters that are not alphanumeric', () => {
    const invalidHandle = '!!%%^^&&';
    expect(userProfileSetHandleV1(user1.token, invalidHandle)).toStrictEqual({ code: 400, error: 'handleStr should be alphanumeric' });
  });
});

describe('success case', () => {
  test('Test success to update the handle', () => {
    const handle = 'jimjohnsonjim';
    userProfileSetHandleV1(user1.token, handle);
    expect(userProfileV2(user1.token, user1.authUserId)).toStrictEqual({
      user: {
        uId: user1.authUserId,
        email: 'jimjohnson@gmail.com',
        nameFirst: 'Jim',
        nameLast: 'Johnson',
        handleStr: 'jimjohnsonjim',
        profileImgUrl: expect.any(String)
      }
    });
  });
});
