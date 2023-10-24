import { authRegisterV3, authLoginV3, clearV1, userProfileV2 } from '../testHelperFunctions';
import { authUserId } from '../../interface';

let user: authUserId;

beforeEach(() => {
  clearV1();
  user = authRegisterV3('zaciscool@gmail.com', '12345678', 'Zac', 'Albert');
});

test('Test if function will send an error for an unregistered account', () => {
  expect(authLoginV3('totrealaccount@gmail.com', 'pizza')).toStrictEqual({ code: 400, error: 'email does not belong to a user' });
});

test('Test invalid password', () => {
  expect(authLoginV3('zaciscool@gmail.com', 'wrongPassword')).toStrictEqual({ code: 400, error: 'incorrect password' });
});

test('Test invalid email', () => {
  expect(authLoginV3('zaciscoolgmail.com', '12345678')).toStrictEqual({ code: 400, error: 'invalid email address' });
});

test('Tests if the authId given from both functions are the same', () => {
  expect((authLoginV3('zaciscool@gmail.com', '12345678') as authUserId).authUserId).toStrictEqual(user.authUserId);
});

test('Test if the two different tokens will be given to a user loging in on different devices', () => {
  const login1 = authLoginV3('zaciscool@gmail.com', '12345678') as authUserId;
  const login2 = authLoginV3('zaciscool@gmail.com', '12345678') as authUserId;
  expect(login2.token).not.toStrictEqual(login1.token);
  expect(userProfileV2(login1.token, login1.authUserId)).toStrictEqual(userProfileV2(login2.token, login2.authUserId));
});
