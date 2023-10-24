import { authLoginV3, authRegisterV3, channelsCreateV2, clearV1, messageSendV1, messageRemoveV1, channelMessagesV2, dmCreateV1, messageSendDmV1 } from '../testHelperFunctions';
import { authUserId, channelId, messageId } from '../../interface';

// Constants for most/all tests
let user1Log: authUserId;
let chan1: channelId;
let user2Log: authUserId;
let chan2: channelId;

beforeEach(() => {
  clearV1();

  // To make a single user who made a channel and had sent some messages
  authRegisterV3('zaciscool@gmail.com', '12345678', 'Zac', 'Albert');
  user1Log = authLoginV3('zaciscool@gmail.com', '12345678');
  chan1 = channelsCreateV2(user1Log.token, 'Club Sandwich', false);

  // To make a second user in their own channel
  authRegisterV3('zacisdumb@gmail.com', '12345678', 'Al', 'Bert');
  user2Log = authLoginV3('zacisdumb@gmail.com', '12345678');
  chan2 = channelsCreateV2(user2Log.token, 'Sushi Squad', true);
});

test('Test if messagesSend will not send a message to an invalid channel', () => {
  const invalChannel = messageSendV1(user1Log.token, 500, 'Zac smells');
  expect(invalChannel).toStrictEqual({ code: 400, error: 'invalid channel' });
});

test('Test if messagesSend will not send a message if the token is invalid', () => {
  const invalToken = messageSendV1('wrongToken', chan1.channelId, 'Zac smells');
  // Note: tokens are always 6 charactres. This will never be a token
  expect(invalToken).toStrictEqual({ code: 403, error: 'invalid token' });
});

test('Test if messagesSend will not send an empty message', () => {
  const emptyMessage = messageSendV1(user1Log.token, chan1.channelId, '');
  expect(emptyMessage).toStrictEqual({ code: 400, error: 'message length is less than 1' });
});

test('Test if messagesSend will not send a message with over 1000 characters', () => {
  const tooBigMessage = 'a'.repeat(1001);
  const bigMessage = messageSendV1(user1Log.token, chan1.channelId, tooBigMessage);
  expect(bigMessage).toStrictEqual({ code: 400, error: 'message length is greater than 1000' });
});

test('Test the function will send an error if the channelId is correct but the member is not an authorised member', () => {
  const idOfWrongChannel = messageSendV1(user1Log.token, chan2.channelId, 'Zac smells');
  expect(idOfWrongChannel).toStrictEqual({ code: 403, error: 'user is not in channel' });
});

test('Test if the message ID will not return a value already used in a removed message', () => {
  const initMess = messageSendV1(user1Log.token, chan1.channelId, 'Zac smells') as messageId;
  messageRemoveV1(user1Log.token, initMess.messageId);
  const newMess = messageSendV1(user1Log.token, chan1.channelId, 'Zac smells') as messageId;
  expect(initMess.messageId).not.toStrictEqual(newMess.messageId);
});

test('Test if messageSend works in a case that should not contain errors', () => {
  const noError = messageSendV1(user1Log.token, chan1.channelId, 'Zac smells') as messageId;
  expect(noError.messageId).toStrictEqual(expect.any(Number));
});

test('Test if message is actually sent', () => {
  const message = messageSendV1(user1Log.token, chan1.channelId, 'Zac smells') as messageId;
  expect(channelMessagesV2(user1Log.token, chan1.channelId, 0).messages).toStrictEqual([
    {
      messageId: message.messageId,
      uId: user1Log.authUserId,
      message: 'Zac smells',
      timeSent: expect.any(Number),
      reacts: [],
      isPinned: false,
    }
  ]);
});

test('messageId is unique, regardless of being in DM or channel', () => {
  const dmId = dmCreateV1(user1Log.token, [user2Log.authUserId]);
  const dmMessageId = messageSendDmV1(user1Log.token, dmId, 'dm message').messageId;
  const channelMessageId = messageSendV1(user1Log.token, chan1.channelId, 'channel message').messageId;
  expect(dmMessageId).not.toStrictEqual(channelMessageId);
});
