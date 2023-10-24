import { authLoginV3, authRegisterV3, clearV1, channelsCreateV2, dmCreateV1, dmListV1, channelsListV2 } from './testHelperFunctions';

test('success', () => {
  authRegisterV3('johnsmith@gmail.com', '12345678', 'John', 'Smith');
  clearV1();
  const result = (authLoginV3('johnsmith@gmail.com', '12345678'));
  expect(result).toStrictEqual({ code: 400, error: 'email does not belong to a user' });
});

test('success to clear a channel', () => {
  const user = authRegisterV3('johnsmith@gmail.com', '12345678', 'John', 'Smith');
  channelsCreateV2(user.token, 'Channel1', true);
  clearV1();
  const user1 = authRegisterV3('johnsmith@gmail.com', '12345678', 'John', 'Smith');
  expect(channelsListV2(user1.token)).toStrictEqual({ channels: [] });
});

test('success to clear a dm', () => {
  const user0 = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario');

  const user1 = authRegisterV3('lancebai@hotmail.com', 'password1', 'Lance', 'Bai');
  const uId1 = user1.authUserId;

  const user2 = authRegisterV3('jimjohnson@gmail.com', 'password2', 'Jim', 'Johnson');
  const uId2 = user2.authUserId;

  const user3 = authRegisterV3('johnsmith@gmail.com', 'password3', 'John', 'Smith');
  const uId3 = user3.authUserId;

  const uIds = [uId1, uId2, uId3];

  dmCreateV1(user0.token0, uIds);
  clearV1();
  const user = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario');
  expect(dmListV1(user.token)).toStrictEqual({ dms: [] });
});
