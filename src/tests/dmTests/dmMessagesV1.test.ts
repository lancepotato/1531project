import { authUserId } from '../../interface';
import { authLogoutV2, authRegisterV3, clearV1, dmCreateV1, dmMessagesV1, messageSendDmV1 } from '../testHelperFunctions';

let user: authUserId;
let dmId: number;
beforeEach(() => {
  clearV1();
  user = authRegisterV3('jimjohnson@gmail.com', 'password2', 'Jim', 'Johnson');
  dmId = dmCreateV1(user.token, []).dmId;
});

describe('error cases', () => {
  test('invalid dmId', () => {
    const invalidDmId = dmId + 1;
    expect(dmMessagesV1(user.token, invalidDmId, 0)).toStrictEqual(
      { code: 400, error: 'invalid dmId' }
    );
  });
  test('start is greater than total number of messages', () => {
    expect(dmMessagesV1(user.token, dmId, 9999)).toStrictEqual(
      { code: 400, error: 'start is greater than total messages' }
    );
  });
  test('user is not a member', () => {
    const user2 = authRegisterV3('johnsmith@gmail.com', 'password', 'John', 'Smith');
    expect(dmMessagesV1(user2.token, dmId, 0)).toStrictEqual(
      { code: 403, error: 'user is not a member' }
    );
  });
  test('invalid token', () => {
    authLogoutV2(user.token);
    expect(dmMessagesV1(user.token, dmId, 0)).toStrictEqual(
      { code: 403, error: 'invalid token' }
    );
  });
});

describe('success cases', () => {
  test('empty messages', () => {
    expect(dmMessagesV1(user.token, dmId, 0)).toStrictEqual(
      {
        messages: [],
        start: 0,
        end: -1,
      }
    );
  });
  test('< 50 messages, check recent is index 0', () => {
    messageSendDmV1(user.token, dmId, 'oldMessage');
    messageSendDmV1(user.token, dmId, 'recent');
    expect(dmMessagesV1(user.token, dmId, 0)).toStrictEqual(
      {
        messages: [
          {
            messageId: expect.any(Number),
            uId: user.authUserId,
            message: 'recent',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          },
          {
            messageId: expect.any(Number),
            uId: user.authUserId,
            message: 'oldMessage',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ],
        start: 0,
        end: -1
      }
    );
  });
  test('more than 50 messages', () => {
    for (let i = 0; i < 52; i++) {
      messageSendDmV1(user.token, dmId, 'message');
    }
    expect(dmMessagesV1(user.token, dmId, 1)).toStrictEqual(
      {
        messages: expect.anything(),
        start: 1,
        end: 51,
      }
    );
    expect(dmMessagesV1(user.token, dmId, 1).messages.length).toStrictEqual(50);
  });
  test('latest is returned', () => {
    for (let i = 0; i < 50; i++) {
      messageSendDmV1(user.token, dmId, 'message');
    }
    expect(dmMessagesV1(user.token, dmId, 0)).toStrictEqual(
      {
        messages: expect.anything(),
        start: 0,
        end: -1,
      }
    );
    expect(dmMessagesV1(user.token, dmId, 0).messages.length).toStrictEqual(50);
  });
});
