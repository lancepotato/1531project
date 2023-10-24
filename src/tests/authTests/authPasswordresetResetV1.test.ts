import { loadData } from '../../dataStore';
import { authRegisterV3, authPasswordresetResetV1, authPasswordresetRequestV1, clearV1 } from '../testHelperFunctions';
import { getHashOf } from '../../helper';

clearV1();
authRegisterV3('comp1531tests@gmail.com', '12345678', 'Zac', 'Albert');
authPasswordresetRequestV1('comp1531tests@gmail.com');

test('Test when the new password is less than 6 characters', () => {
  expect(authPasswordresetResetV1('Banana', '123')).toStrictEqual({ code: 400, error: 'Password must be at least 6 characters long' });
  // The code tests the password length first
  // Even though the reset code is wrong, it will not cause the error
});

test('Test when the reset Code is invalid', () => {
  expect(authPasswordresetResetV1('Banana', 'abcdefg')).toStrictEqual({ code: 400, error: 'invalid reset code' });
});

test('Test that the password changes when given the correct inputs', () => {
  const data1 = loadData();
  expect(data1.users[0].password).toStrictEqual(getHashOf('12345678'));
  authPasswordresetResetV1(data1.users[0].passwordResetCode, 'abcdefgh');
  const data2 = loadData();
  expect(data2.users[0].password).toStrictEqual(getHashOf('abcdefgh'));
  expect(authPasswordresetResetV1(data1.users[0].passwordResetCode, 'abcdefgh')).toStrictEqual({ code: 400, error: 'invalid reset code' });
  clearV1();
});
