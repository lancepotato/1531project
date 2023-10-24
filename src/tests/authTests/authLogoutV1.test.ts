import { authUserId } from '../../interface';
import { authRegisterV3, authLogoutV2, clearV1 } from '../testHelperFunctions';

let userReg: authUserId;

beforeEach(() => {
  clearV1();
  userReg = authRegisterV3('zaciscool@gmail.com', '12345678', 'Zac', 'Albert');
});

test('Test if the function will return an error when you send in a faulty token', () => {
  const faultyToken = authLogoutV2(userReg.token + '2');
  expect(faultyToken).toStrictEqual({ code: 403, error: 'invalid token' });
});

test('Test if the function does not cause an error or crashes', () => {
  const userLogout = authLogoutV2(userReg.token);
  expect(userLogout).toStrictEqual({});
});

test('Test successful logout', () => {
  expect(authLogoutV2(userReg.token)).toStrictEqual({});
  expect(authLogoutV2(userReg.token)).toStrictEqual({ code: 403, error: 'invalid token' });
});
