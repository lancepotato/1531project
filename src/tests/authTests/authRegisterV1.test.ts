import { authRegisterV3, userProfileV2, clearV1 } from '../testHelperFunctions';
import { authUserId, profile } from '../../interface';

beforeEach(() => {
  clearV1();
});
describe('authRegister errors', () => {
  test('Test if function gives correct return type after inputting correct email and password', () => {
    expect(authRegisterV3('zacisdefcool@gmail.com', 'ZacI5Co0l1234', 'Zac', 'Albert')).toStrictEqual({ authUserId: expect.any(Number), token: expect.any(String) });
  });

  test('Test invalid email', () => {
    expect(authRegisterV3('zaciscoolgmail.com', 'ZacI5Co0l1234', 'Zac', 'Albert')).toStrictEqual({ code: 400, error: 'invalid email address' });
  });

  test('Test email is already in use', () => {
    authRegisterV3('zaciscool@gmail.com', 'ZacI5Co0l1234', 'Zac', 'Albert');
    expect(authRegisterV3('zaciscool@gmail.com', 'ZacI5dumB', 'Al', 'Bert')).toStrictEqual({ code: 400, error: 'email address already in use' });
  });

  test('Test password less than 6 characters', () => {
    expect(authRegisterV3('zaciscool@gmail.com', 'Z4c', 'Zac', 'Albert')).toStrictEqual({ code: 400, error: 'password must be at least 6 characters long' });
  });

  test('Test nameFirst is larger than 50', () => {
    expect(authRegisterV3('zaciscool@gmail.com', 'ZacI5Co0l1234', '123456789012345678901234567890123456789012345678901', 'Albert')).toStrictEqual({ code: 400, error: 'please enter a first name between 1 and 50 characters (inclusive)' });
  });

  test('Test nameFirst is smaller than 1', () => {
    expect(authRegisterV3('zaciscool@gmail.com', 'ZacI5Co0l1234', '', 'Albert')).toStrictEqual({ code: 400, error: 'please enter a first name between 1 and 50 characters (inclusive)' });
  });

  test('Test nameLast is larger than 50', () => {
    expect(authRegisterV3('zaciscool@gmail.com', 'ZacI5Co0l1234', 'Zac', '123456789012345678901234567890123456789012345678901')).toStrictEqual({ code: 400, error: 'please enter a Last name between 1 and 50 characters (inclusive)' });
  });

  test('Test nameLast is smaller than 1', () => {
    expect(authRegisterV3('zaciscool@gmail.com', 'ZacI5Co0l1234', 'Zac', '')).toStrictEqual({ code: 400, error: 'please enter a Last name between 1 and 50 characters (inclusive)' });
  });
});

describe('generation of handle string', () => {
  test('Tests duplicate handle strings', () => {
    const user1 = authRegisterV3('zacalbert1@gmail.com', '12345678', 'J', 'D') as authUserId;
    expect((userProfileV2(user1.token, user1.authUserId) as profile).user.handleStr).toStrictEqual('jd');
    const user2 = authRegisterV3('zacalbert2@gmail.com', '12345678', 'J', 'D') as authUserId;
    expect((userProfileV2(user2.token, user2.authUserId) as profile).user.handleStr).toStrictEqual('jd0');
    const user3 = authRegisterV3('zacalbert3@gmail.com', '12345678', 'J', 'D') as authUserId;
    expect((userProfileV2(user3.token, user3.authUserId) as profile).user.handleStr).toStrictEqual('jd1');
  });

  test('Tests duplicate handle strings at 20 character limit', () => {
    const user1 = authRegisterV3('zacalbert1@gmail.com', '12345678', '1234567890', '1234567890') as authUserId;
    expect((userProfileV2(user1.token, user1.authUserId) as profile).user.handleStr).toStrictEqual('12345678901234567890');
    const user2 = authRegisterV3('zacalbert2@gmail.com', '12345678', '1234567890', '1234567890') as authUserId;
    expect((userProfileV2(user2.token, user2.authUserId) as profile).user.handleStr).toStrictEqual('123456789012345678900');
  });

  test('Tests handle string longer than 20', () => {
    const user = authRegisterV3('zacalbert10@gmail.com', '12345678', 'QWERTYUIOPASDF', 'GHJKLZXCVBNM') as authUserId;
    expect((userProfileV2(user.token, user.authUserId) as profile).user.handleStr).toStrictEqual('qwertyuiopasdfghjklz');
  });
  test('handle string removes non alphanumeric characters', () => {
    const user = authRegisterV3('zacalbert10@gmail.com', '12345678', '@bcdefgh!j', 'klmn opqrst') as authUserId;
    expect((userProfileV2(user.token, user.authUserId) as profile).user.handleStr).toStrictEqual('bcdefghjklmnopqrst');
  });
});
