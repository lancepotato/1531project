import { loadData } from '../../dataStore';
import { authUserId } from '../../interface';
import { authRegisterV3, clearV1, adminUserPermissionChangeV1 } from '../testHelperFunctions';

let user0: authUserId;
let user1: authUserId;

beforeEach(() => {
  clearV1();
  user0 = authRegisterV3('globowner@internode.com', 'monkey', 'Mon', 'Key');
  user1 = authRegisterV3('zaciscool@gmail.com', '12345678', 'Zac', 'Albert');
});

describe('Error cases', () => {
  test('Test if the function throw an error if token is invalid', () => {
    const invalidToken = user0.token + user1.token;
    expect(adminUserPermissionChangeV1(invalidToken, user1.authUserId, 1)).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('Test if the function throws an error when it receives an invalid uId', () => {
    expect(adminUserPermissionChangeV1(user0.token, user1.authUserId + 333, 1)).toStrictEqual({ code: 400, error: 'invalid uId' });
  });
  test('Test an error is thrown when the function changes the permission of the global owner', () => {
    expect(adminUserPermissionChangeV1(user0.token, user0.authUserId, 2)).toStrictEqual({ code: 400, error: 'Cannot change permission of the only global owner' });
  });
  test('Test the function throws an error when an invalid permission is used', () => {
    expect(adminUserPermissionChangeV1(user0.token, user1.authUserId, 3)).toStrictEqual({ code: 400, error: 'invalid permissionId' });
  });
  test('Test the function throws an error if the person getting their permission changed is of that permission level', () => {
    expect(adminUserPermissionChangeV1(user0.token, user1.authUserId, 2)).toStrictEqual({ code: 400, error: 'User already has that permissionId' });
  });
  test('Test the function throws an error if a global member tries using the function', () => {
    expect(adminUserPermissionChangeV1(user1.token, user0.authUserId, 2)).toStrictEqual({ code: 403, error: 'Must be a global owner to use this function' });
  });
});

describe('Success cases', () => {
  test('Tests if the function works properly when given the correct inputs (member to owner)', () => {
    expect(adminUserPermissionChangeV1(user0.token, user1.authUserId, 1)).toStrictEqual({});
    const data = loadData();
    expect(data.users[1].permissionId).toStrictEqual(1);
  });
  test('demoting an owner to a member', () => {
    expect(adminUserPermissionChangeV1(user0.token, user1.authUserId, 1)).toStrictEqual({});
    let data = loadData();
    expect(data.users[1].permissionId).toStrictEqual(1);
    expect(adminUserPermissionChangeV1(user0.token, user1.authUserId, 2)).toStrictEqual({});
    data = loadData();
    expect(data.users[1].permissionId).toStrictEqual(2);
  });
});
