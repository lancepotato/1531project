import { authUserId } from '../../interface';
import { authRegisterV3, dmCreateV1, dmListV1, clearV1 } from '../testHelperFunctions';

let user1: authUserId;
let user2: authUserId;

beforeEach(() => {
  clearV1();
  user1 = authRegisterV3('jimjohnson@gmail.com', 'password2', 'Jim', 'Johnson');
  user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith');
  dmCreateV1(user1.token, [user2.authUserId]);
  dmCreateV1(user1.token, []);
});

test('invalid token', () => {
  const invalidToken = '';
  expect(dmListV1(invalidToken)).toStrictEqual(
    { code: 403, error: 'invalid token' }
  );
});

describe('success cases', () => {
  test('member of all dms', () => {
    const list = dmListV1(user1.token);
    list.dms = new Set(list.dms);
    expect(list).toStrictEqual(
      {
        dms: new Set([
          {
            dmId: expect.any(Number),
            name: 'jimjohnson, johnsmith',
          },
          {
            dmId: expect.any(Number),
            name: 'jimjohnson',
          },
        ])
      }
    );
  });
  test('member of 1 of dm', () => {
    expect(dmListV1(user2.token)).toStrictEqual(
      {
        dms: [
          {
            dmId: expect.any(Number),
            name: 'jimjohnson, johnsmith',
          }
        ]
      }
    );
  });
  test('member of no dms', () => {
    const user3 = authRegisterV3('jsmith@gmail.com', 'password', 'J', 'Smith');
    expect(dmListV1(user3.token)).toStrictEqual(
      {
        dms: [],
      }
    );
  });
});
