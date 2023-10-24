import { authRegisterV3, clearV1, channelsCreateV2, channelJoinV2, messageSendV1, messageRemoveV1, dmCreateV1, dmMessagesV1, messageSendDmV1, channelMessagesV2 } from '../testHelperFunctions';
import { authUserId } from '../../interface';

let uIds: number[];
const userAr: authUserId[] = [];
let dmId: number;
let messageId: number;
let channelId: number;

describe('Channels', () => {
  beforeEach(() => {
    clearV1();
    userAr[0] = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;

    userAr[1] = authRegisterV3('lancebai@hotmail.com', 'password1', 'Lance', 'Bai') as authUserId;

    userAr[2] = authRegisterV3('jimjohnson@gmail.com', 'password2', 'Jim', 'Johnson') as authUserId;

    userAr[3] = authRegisterV3('johnsmith@gmail.com', 'password3', 'John', 'Smith') as authUserId;

    channelId = channelsCreateV2(userAr[1].token, 'Channel1', true).channelId;
    channelJoinV2(userAr[2].token, channelId);
    channelJoinV2(userAr[0].token, channelId);
    messageId = messageSendV1(userAr[2].token, channelId, 'message').messageId;
  });

  test('invalid token', () => {
    const invalidToken = userAr[0].token + userAr[1].token + userAr[2].token + userAr[3].token;
    expect(messageRemoveV1(invalidToken, messageId)).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('invalid messageId', () => {
    const invalidMessageId = messageId + 1;
    expect(messageRemoveV1(userAr[2].token, invalidMessageId)).toStrictEqual({ code: 400, error: 'invalid messageId' });
  });

  test('messageId is in channel that user is not in', () => {
    expect(messageRemoveV1(userAr[3].token, messageId)).toStrictEqual({ code: 400, error: 'user is not in channel that message is in' });
  });

  test('user is not the author of messageId, and is not an owner of the channel', () => {
    channelJoinV2(userAr[3].token, channelId);
    expect(messageRemoveV1(userAr[3].token, messageId)).toStrictEqual({ code: 403, error: 'user is not author of message, and is not an owner' });
  });

  test('success: owner of channel removes someone else\'s message', () => {
    expect(channelMessagesV2(userAr[1].token, channelId, 0).messages).toStrictEqual([
      {
        messageId: messageId,
        uId: userAr[2].authUserId,
        message: 'message',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      }
    ]);
    messageRemoveV1(userAr[0].token, messageId);
    expect(channelMessagesV2(userAr[1].token, channelId, 0)).toStrictEqual(
      {
        messages: [],
        start: 0,
        end: -1
      }
    );
  });

  test('success: global owner removes someone else\'s message', () => {
    messageRemoveV1(userAr[0].token, messageId);
    expect(channelMessagesV2(userAr[1].token, channelId, 0)).toStrictEqual(
      {
        messages: [],
        start: 0,
        end: -1
      }
    );
  });

  test('success: original author removes their own message', () => {
    messageRemoveV1(userAr[2].token, messageId);
    expect(channelMessagesV2(userAr[1].token, channelId, 0)).toStrictEqual(
      {
        messages: [],
        start: 0,
        end: -1
      }
    );
  });

  test('success: multiple messages exist', () => {
    const messageId1 = messageSendV1(userAr[2].token, channelId, 'message 1').messageId;
    const messageId2 = messageSendV1(userAr[1].token, channelId, 'message 2').messageId;
    expect(channelMessagesV2(userAr[1].token, channelId, 0).messages).toStrictEqual([
      {
        messageId: messageId2,
        uId: userAr[1].authUserId,
        message: 'message 2',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      },
      {
        messageId: messageId1,
        uId: userAr[2].authUserId,
        message: 'message 1',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      },
      {
        messageId: messageId,
        uId: userAr[2].authUserId,
        message: 'message',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      }
    ]);
    messageRemoveV1(userAr[0].token, messageId1);
    expect(channelMessagesV2(userAr[1].token, channelId, 0).messages).toStrictEqual([
      {
        messageId: messageId2,
        uId: userAr[1].authUserId,
        message: 'message 2',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      },
      {
        messageId: messageId,
        uId: userAr[2].authUserId,
        message: 'message',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      }
    ]);
  });
});

describe('DMs', () => {
  beforeEach(() => {
    clearV1();
    userAr[0] = authRegisterV3('luigimario@hotmail.com', 'password0', 'Luigi', 'Mario') as authUserId;

    userAr[1] = authRegisterV3('lancebai@hotmail.com', 'password1', 'Lance', 'Bai') as authUserId;

    userAr[2] = authRegisterV3('jimjohnson@gmail.com', 'password2', 'Jim', 'Johnson') as authUserId;

    userAr[3] = authRegisterV3('johnsmith@gmail.com', 'password3', 'John', 'Smith') as authUserId;

    uIds = [userAr[1].authUserId, userAr[2].authUserId];

    dmId = dmCreateV1(userAr[0].token, uIds).dmId;

    messageId = messageSendDmV1(userAr[2].token, dmId, 'message').messageId;
  });

  test('invalid token', () => {
    const invalidToken = userAr[0].token + userAr[1].token + userAr[2].token + userAr[3].token;
    expect(messageRemoveV1(invalidToken, messageId)).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('invalid messageId', () => {
    const invalidId = messageId + 1;
    expect(messageRemoveV1(userAr[0].token, invalidId)).toStrictEqual({ code: 400, error: 'invalid messageId' });
  });

  test('messageId is in DM that user is not in', () => {
    expect(messageRemoveV1(userAr[3].token, messageId)).toStrictEqual({ code: 400, error: 'user is not in channel that message is in' });
  });

  test('user is not the author of messageId, and is not an owner of the DM', () => {
    expect(messageRemoveV1(userAr[1].token, messageId)).toStrictEqual({ code: 403, error: 'user is not author of message, and is not an owner' });
  });

  test('success: owner of DM removes someone else\'s message', () => {
    expect(dmMessagesV1(userAr[1].token, dmId, 0).messages).toStrictEqual([
      {
        messageId: messageId,
        uId: userAr[2].authUserId,
        message: 'message',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      }
    ]);
    expect(messageRemoveV1(userAr[0].token, messageId)).toStrictEqual({});
    expect(dmMessagesV1(userAr[1].token, dmId, 0)).toStrictEqual(
      {
        messages: [],
        start: 0,
        end: -1
      }
    );
  });

  test('success: original author removes their own message', () => {
    expect(dmMessagesV1(userAr[1].token, dmId, 0).messages).toStrictEqual([
      {
        messageId: messageId,
        uId: userAr[2].authUserId,
        message: 'message',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      }
    ]);
    expect(messageRemoveV1(userAr[2].token, messageId)).toStrictEqual({});
    expect(dmMessagesV1(userAr[1].token, dmId, 0)).toStrictEqual(
      {
        messages: [],
        start: 0,
        end: -1
      }
    );
  });

  test('success: the correct message is edited when multiple messages exist', () => {
    const messageId1 = messageSendDmV1(userAr[2].token, dmId, 'message 1').messageId;
    const messageId2 = messageSendDmV1(userAr[1].token, dmId, 'message 2').messageId;
    expect(dmMessagesV1(userAr[1].token, dmId, 0).messages).toStrictEqual([
      {
        messageId: messageId2,
        uId: userAr[1].authUserId,
        message: 'message 2',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      },
      {
        messageId: messageId1,
        uId: userAr[2].authUserId,
        message: 'message 1',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      },
      {
        messageId: messageId,
        uId: userAr[2].authUserId,
        message: 'message',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      }
    ]);
    expect(messageRemoveV1(userAr[2].token, messageId1)).toStrictEqual({});
    expect(dmMessagesV1(userAr[1].token, dmId, 0).messages).toStrictEqual([
      {
        messageId: messageId2,
        uId: userAr[1].authUserId,
        message: 'message 2',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      },
      {
        messageId: messageId,
        uId: userAr[2].authUserId,
        message: 'message',
        timeSent: expect.any(Number),
        reacts: [],
        isPinned: false,
      }
    ]);
  });
});
