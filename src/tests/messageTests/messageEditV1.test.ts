import { authRegisterV3, clearV1, channelsCreateV2, channelJoinV2, channelLeaveV1, channelAddOwnerV1, channelRemoveOwnerV1, messageSendV1, messageEditV1, dmCreateV1, dmMessagesV1, messageSendDmV1, channelMessagesV2 } from '../testHelperFunctions';
import { authUserId } from '../../interface';

const userAr: authUserId[] = [];
let uIds: number[];
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
    channelJoinV2(userAr[0].token, channelId); // global owner joins the channel
    messageId = messageSendV1(userAr[2].token, channelId, 'message').messageId;
  });

  describe('error testing', () => {
    test('invalid token', () => {
      const invalidToken = userAr[0].token + userAr[1].token + userAr[2].token + userAr[3].token;
      expect(messageEditV1(invalidToken, messageId, 'edit message')).toStrictEqual({ code: 403, error: 'invalid token' });
    });

    test('invalid messageId', () => {
      const invalidId = messageId + 1;
      expect(messageEditV1(userAr[0].token, invalidId, 'edit message')).toStrictEqual({ code: 400, error: 'invalid messageId' });
    });

    test('message length is greater than 1000', () => {
      let message = '';
      for (let i = 0; message.length < 1000; i++) {
        message += 'sdfklsdjfsdpfzdifopqkpowfmapfdslkfmxpfosdof sdkafjdsa o[aw e[sfdsfxkjlf kzlm';
      }
      expect(messageEditV1(userAr[2].token, messageId, message)).toStrictEqual({ code: 400, error: 'message length is greater than 1000' });
    });

    test('messageId is in channel that user is not in', () => {
      expect(messageEditV1(userAr[3].token, messageId, 'edit message')).toStrictEqual({ code: 400, error: 'user is not in channel that message is in' });
    });

    test('user is not the author of messageId, and is not an owner of the channel', () => {
      channelJoinV2(userAr[3].token, channelId);
      expect(messageEditV1(userAr[3].token, messageId, 'edit message')).toStrictEqual({ code: 403, error: 'user is not author of message, and is not an owner' });
    });
  });

  describe('successful cases', () => {
    test('owner of channel edits someone else\'s message', () => {
      expect(channelMessagesV2(userAr[1].token, channelId, 0).messages).toStrictEqual(
        [
          {
            messageId: messageId,
            uId: userAr[2].authUserId,
            message: 'message',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ]
      );
      expect(messageEditV1(userAr[1].token, messageId, 'edit message')).toStrictEqual({});
      expect(channelMessagesV2(userAr[1].token, channelId, 0).messages).toStrictEqual(
        [
          {
            messageId: messageId,
            uId: userAr[2].authUserId,
            message: 'edit message',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ]
      );
    });

    test('global owner edits someone else\'s message', () => {
      expect(channelMessagesV2(userAr[0].token, channelId, 0).messages).toStrictEqual(
        [
          {
            messageId: messageId,
            uId: userAr[2].authUserId,
            message: 'message',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ]
      );
      expect(messageEditV1(userAr[0].token, messageId, 'edit message')).toStrictEqual({});
      expect(channelMessagesV2(userAr[1].token, channelId, 0).messages).toStrictEqual(
        [
          {
            messageId: messageId,
            uId: userAr[2].authUserId,
            message: 'edit message',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ]
      );
    });

    test('original author edits their own message', () => {
      expect(channelMessagesV2(userAr[2].token, channelId, 0).messages).toStrictEqual(
        [
          {
            messageId: messageId,
            uId: userAr[2].authUserId,
            message: 'message',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ]
      );
      expect(messageEditV1(userAr[2].token, messageId, 'edit message')).toStrictEqual({});
      expect(channelMessagesV2(userAr[2].token, channelId, 0).messages).toStrictEqual(
        [
          {
            messageId: messageId,
            uId: userAr[2].authUserId,
            message: 'edit message',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ]
      );
    });

    test('original author leaves and joins back', () => {
      channelLeaveV1(userAr[2].token, channelId);
      expect(messageEditV1(userAr[2].token, messageId, 'edit message outside')).toStrictEqual({ code: 400, error: 'user is not in channel that message is in' });
      channelJoinV2(userAr[2].token, channelId);
      expect(messageEditV1(userAr[2].token, messageId, 'edit message inside')).toStrictEqual({});
      expect(channelMessagesV2(userAr[2].token, channelId, 0).messages).toStrictEqual(
        [
          {
            messageId: messageId,
            uId: userAr[2].authUserId,
            message: 'edit message inside',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ]
      );
    });

    test('owner edits a message, but is removed as an owner after', () => {
      channelJoinV2(userAr[3].token, channelId);
      channelAddOwnerV1(userAr[1].token, channelId, userAr[3].authUserId);
      expect(messageEditV1(userAr[3].token, messageId, 'edit message 1')).toStrictEqual({});
      expect(channelMessagesV2(userAr[3].token, channelId, 0).messages).toStrictEqual(
        [
          {
            messageId: messageId,
            uId: userAr[2].authUserId,
            message: 'edit message 1',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ]
      );

      channelRemoveOwnerV1(userAr[1].token, channelId, userAr[3].authUserId);
      expect(messageEditV1(userAr[3].token, messageId, 'edit message 2')).toStrictEqual({ code: 403, error: 'user is not author of message, and is not an owner' });
    });

    test('global owner edits a message, but is removed from the channel after', () => {
      expect(messageEditV1(userAr[0].token, messageId, 'global owner message')).toStrictEqual({});
      expect(channelMessagesV2(userAr[0].token, channelId, 0).messages).toStrictEqual(
        [
          {
            messageId: messageId,
            uId: userAr[2].authUserId,
            message: 'global owner message',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ]
      );
      channelLeaveV1(userAr[0].token, channelId);
      expect(messageEditV1(userAr[0].token, messageId, 'global owner outside')).toStrictEqual({ code: 400, error: 'user is not in channel that message is in' });
    });
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

  describe('error testing', () => {
    test('invalid token', () => {
      const invalidToken = userAr[0].token + userAr[1].token + userAr[2].token + userAr[3].token;
      expect(messageEditV1(invalidToken, messageId, 'edit message')).toStrictEqual({ code: 403, error: 'invalid token' });
    });

    test('invalid messageId', () => {
      const invalidId = messageId + 1;
      expect(messageEditV1(userAr[0].token, invalidId, 'edit message')).toStrictEqual({ code: 400, error: 'invalid messageId' });
    });

    test('message length is greater than 1000', () => {
      let message = '';
      for (let i = 0; message.length < 1000; i++) {
        message += 'sdfklsdjfsdpfzdifopqkpowfmapfdslkfmxpfosdof sdkafjdsa o[aw e[sfdsfxkjlf kzlm';
      }
      expect(messageEditV1(userAr[2].token, messageId, message)).toStrictEqual({ code: 400, error: 'message length is greater than 1000' });
    });

    test('messageId is in DM that user is not in', () => {
      expect(messageEditV1(userAr[3].token, messageId, 'edit message')).toStrictEqual({ code: 400, error: 'user is not in channel that message is in' });
    });

    test('user is not the author of messageId, and is not an owner of the DM', () => {
      expect(messageEditV1(userAr[1].token, messageId, 'edit message')).toStrictEqual({ code: 403, error: 'user is not author of message, and is not an owner' });
    });
  });

  describe('successful cases', () => {
    test('owner of DM edits someone else\'s message', () => {
      expect(dmMessagesV1(userAr[1].token, dmId, 0).messages).toStrictEqual(
        [
          {
            messageId: messageId,
            uId: userAr[2].authUserId,
            message: 'message',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ]
      );
      expect(messageEditV1(userAr[0].token, messageId, 'edit message')).toStrictEqual({});
      expect(dmMessagesV1(userAr[1].token, dmId, 0).messages).toStrictEqual(
        [
          {
            messageId: messageId,
            uId: userAr[2].authUserId,
            message: 'edit message',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ]
      );
    });

    test('original author edits their own message', () => {
      expect(dmMessagesV1(userAr[1].token, dmId, 0).messages).toStrictEqual(
        [
          {
            messageId: messageId,
            uId: userAr[2].authUserId,
            message: 'message',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ]
      );
      expect(messageEditV1(userAr[2].token, messageId, 'edit message')).toStrictEqual({});
      expect(dmMessagesV1(userAr[1].token, dmId, 0).messages).toStrictEqual(
        [
          {
            messageId: messageId,
            uId: userAr[2].authUserId,
            message: 'edit message',
            timeSent: expect.any(Number),
            reacts: [],
            isPinned: false,
          }
        ]
      );
    });

    test('the correct message is edited when multiple messages exist', () => {
      const messageId1 = messageSendDmV1(userAr[2].token, dmId, 'message 1').messageId;
      const messageId2 = messageSendDmV1(userAr[1].token, dmId, 'message 2').messageId;
      expect(dmMessagesV1(userAr[1].token, dmId, 0).messages).toStrictEqual(
        [
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
        ]
      );
      expect(messageEditV1(userAr[2].token, messageId1, 'edit message')).toStrictEqual({});
      expect(dmMessagesV1(userAr[1].token, dmId, 0).messages).toStrictEqual(
        [
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
            message: 'edit message',
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
        ]
      );
    });
  });
});
