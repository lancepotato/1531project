import { authUserId } from '../../interface';
import { authRegisterV3, userProfileV2, userProfileSetNameV1, clearV1 } from '../testHelperFunctions';

let user: authUserId;
const originalFirstName = 'Jim';
const originalLastName = 'Johnson';

beforeEach(() => {
  clearV1();
  user = authRegisterV3('jimjohnson@gmail.com', 'password1', 'Jim', 'Johnson');
});

describe('error cases', () => {
  test('Test when token is invalid', () => {
    const invalidToken = '';
    expect(userProfileSetNameV1(invalidToken, originalFirstName, originalLastName)).toStrictEqual({ code: 403, error: 'Invalid token' });
  });

  test('Test when length of nameFirst is less than 1', () => {
    const invalidNameFirst = '';
    expect(userProfileSetNameV1(user.token, invalidNameFirst, originalLastName)).toStrictEqual({ code: 400, error: 'Invalid nameFirst' });
  });

  test('Test when length of nameFirst is bigger than 50', () => {
    const invalidNameFirst = 'JimJimJimJimJimJimJimJimJimJimJimJimJimJimJimJimJimJim';
    expect(userProfileSetNameV1(user.token, invalidNameFirst, originalLastName)).toStrictEqual({ code: 400, error: 'Invalid nameFirst' });
  });

  test('Test when length of nameLast is less than 1', () => {
    const invalidNameLast = '';
    expect(userProfileSetNameV1(user.token, originalFirstName, invalidNameLast)).toStrictEqual({ code: 400, error: 'Invalid nameLast' });
  });

  test('Test when length of nameLast is bigger than 50', () => {
    const invalidNameLast = 'JohnsonJohnsonJohnsonJohnsonJohnsonJohnsonJohnsonJohnson';
    expect(userProfileSetNameV1(user.token, originalFirstName, invalidNameLast)).toStrictEqual({ code: 400, error: 'Invalid nameLast' });
  });
});

describe('success case', () => {
  test('Test success to update the name', () => {
    const nameFirst = 'John';
    const nameLast = 'Smith';
    userProfileSetNameV1(user.token, nameFirst, nameLast);
    expect(userProfileV2(user.token, user.authUserId)).toStrictEqual({
      user: {
        uId: user.authUserId,
        email: 'jimjohnson@gmail.com',
        nameFirst: 'John',
        nameLast: 'Smith',
        handleStr: 'jimjohnson',
        profileImgUrl: expect.any(String)
      }
    });
  });
});
