import { authLogoutV2, authRegisterV3, channelsCreateV2, clearV1, standupStartV1, standupSendV1, channelMessagesV2 } from '../testHelperFunctions';

describe('/standup/send tests', () => {
  let token: string;
  let channelId: number;
  let length: number;

  beforeEach(() => {
    clearV1();
    token = authRegisterV3('johnsmith@gmail.com', '12345678', 'John', 'Smith').token;
    channelId = channelsCreateV2(token, 'Channel', true).channelId;
    length = 0.3;
  });

  test('Invalid token', () => {
    authLogoutV2(token);
    standupStartV1(token, channelId, length);
    const result = standupSendV1(token + 1, channelId, 'sample message');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 450);
    expect(result).toEqual({ code: 403, error: 'invalid token' });
  });

  test('Invalid channelId', () => {
    standupStartV1(token, channelId, length);
    const result = standupSendV1(token, channelId + 1, 'sample message');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 450);
    expect(result).toEqual({ code: 400, error: 'invalid channelId' });
  });

  test('Authorised user not a member of channel', () => {
    const invalid = authRegisterV3('invalid@gmail.com', '1234567', 'Invalid', 'User').token;
    standupStartV1(token, channelId, length);
    const result = standupSendV1(invalid, channelId, 'Sample Message');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 450);
    expect(result).toEqual({ code: 403, error: 'User is not a member of channel' });
  });

  test('Message is over 1000 characters', () => {
    standupStartV1(token, channelId, length);
    const result = standupSendV1(token, channelId, 'A common question asked throughout the project is usually "How can I test this?" or "Can I test this?". In any situation, most things can be tested thoroughly. However, some things can only be tested sparsely, and on some other rare occasions, some things can\'t be tested at all. A challenge of this project is for you to use your discretion to figure out what to test, and how much to test. Often, you can use the functions you\'ve already written to test new functions in a black-box manner. The behaviour in which channelMessages returns data is called pagination. It\'s a commonly used method when it comes to getting theoretially unbounded amounts of data from a server to display on a page in chunks. Most of the timelines you know and love - Facebook, Instagram, LinkedIn - do this. Minor isolated fixes after the due date are allowed but carry a penalty to the automark, if the automark after re-running the autotests is greater than your initial automark. This penalty can be up to 30% of the automark for that iteration, depending on the number and nature of your fixes. Note that if the re-run automark after penalty is lower than your initial mark, we will keep your initial mark, meaning your automark cannot decrease after a re-run. E.g. imagine that your initial automark is 50%, on re-run you get a raw automark of 70%, and your fixes attract a 30% penalty: since the 30% penalty will reduce the mark of 70% to 49%, your final automark will still be 50% (i.e. your initial mark).');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 450);
    expect(result).toEqual({ code: 400, error: 'Message is over 1000 chars' });
  });

  test('No active standup', () => {
    expect(standupSendV1(token, channelId, 'Sample Message')).toEqual({ code: 400, error: 'No active standup' });
  });

  test('Sending message after standup finished', () => {
    standupStartV1(token, channelId, length);
    const check = standupSendV1(token, channelId, 'Sample Message');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 450);
    expect(check).toEqual({});
    expect(standupSendV1(token, channelId, 'Sample Message')).toEqual({ code: 400, error: 'No active standup' });
  });

  test('Successful case: Messages sent during standup', () => {
    standupStartV1(token, channelId, length);
    standupSendV1(token, channelId, 'Sample Message');
    standupSendV1(token, channelId, 'Second Sample Message');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 450);
    const result = channelMessagesV2(token, channelId, 0).messages;
    expect(result).toEqual(
      [
        {
          messageId: expect.any(Number),
          uId: 0,
          message: 'johnsmith: Sample Message\njohnsmith: Second Sample Message',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false
        }
      ]
    );
  });
});
