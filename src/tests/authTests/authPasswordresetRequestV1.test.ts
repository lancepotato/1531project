import { authRegisterV3, authPasswordresetRequestV1, clearV1 } from '../testHelperFunctions';
import { loadData } from '../../dataStore';

beforeEach(() => {
  clearV1();
  authRegisterV3('comp1531tests@gmail.com', '12345678', 'Zac', 'Albert');
});

test('Test that the function works when given the correct input', () => {
  expect(authPasswordresetRequestV1('comp1531tests@gmail.com')).toStrictEqual({});
  const data = loadData();
  const remainingTok = data.users;
  expect(remainingTok[0].tokens).toStrictEqual([]);
  // To see if the email is sent requires manually checking the inbox
});

test('Test that the function does not come up with an error when given users that are not registered', () => {
  expect(authPasswordresetRequestV1('zacisnotcool@gmail.com')).toStrictEqual({});
});

test('Test that the function does not come up with an error when given an invalid email', () => {
  expect(authPasswordresetRequestV1('zaciscoolgmail.com')).toStrictEqual({});
});
