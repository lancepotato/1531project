import { authUserId } from '../../interface';
import { authRegisterV3, usersAllV1, clearV1 } from '../testHelperFunctions';

let user1: authUserId;

beforeEach(() => {
  clearV1();
  user1 = authRegisterV3('jimjohnson@gmail.com', 'password1', 'Jim', 'Johnson');
});

describe('error case', () => {
  test('Test when token is invalid', () => {
    const invalidToken = '';
    expect(usersAllV1(invalidToken)).toStrictEqual({ code: 403, error: 'Invalid token' });
  });
});

describe('success cases', () => {
  test('Test having one user', () => {
    const list = usersAllV1(user1.token);
    list.users = new Set(list.users);
    expect(list).toStrictEqual({
      users: new Set([
        {
          uId: user1.authUserId,
          email: 'jimjohnson@gmail.com',
          nameFirst: 'Jim',
          nameLast: 'Johnson',
          handleStr: 'jimjohnson',
        }
      ])
    });
  });

  test('Test all users', () => {
    const user2 = authRegisterV3('johnsmith@gmail.com', 'password2', 'John', 'Smith');
    const list = usersAllV1(user1.token);
    list.users = new Set(list.users);
    expect(list).toStrictEqual({
      users: new Set([
        {
          uId: user1.authUserId,
          email: 'jimjohnson@gmail.com',
          nameFirst: 'Jim',
          nameLast: 'Johnson',
          handleStr: 'jimjohnson',
        },
        {
          uId: user2.authUserId,
          email: 'johnsmith@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
        },
      ])
    });
  });
});
