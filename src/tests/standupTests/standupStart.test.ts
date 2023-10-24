import { authLogoutV2, authRegisterV3, channelsCreateV2, clearV1, standupStartV1, channelMessagesV2 } from '../testHelperFunctions';

describe('/standup/start tests', () => {
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
    const result = standupStartV1(token, channelId, length);
    expect(result).toEqual({ code: 403, error: 'invalid token' });
  });

  test('Invalid channelId', () => {
    const result = standupStartV1(token, channelId + 1, length);
    expect(result).toEqual({ code: 400, error: 'invalid channelId' });
  });

  test('Authorised user not a member of channel', () => {
    const invalid = authRegisterV3('invalid@gmail.com', '1234567', 'Invalid', 'User').token;
    const result = standupStartV1(invalid, channelId, length);
    expect(result).toEqual({ code: 403, error: 'User is not a member of channel' });
  });

  test('Length is a negative number', () => {
    const invalid = -1;
    const result = standupStartV1(token, channelId, invalid);
    expect(result).toEqual({ code: 400, error: 'Length is a negative integer' });
  });

  test('Active standup currently running in channel', () => {
    standupStartV1(token, channelId, length);
    expect(standupStartV1(token, channelId, length)).toEqual({ code: 400, error: 'active standup already running in channel' });
  });

  test('Successful case', () => {
    const startTime: number = Math.floor((new Date()).getTime() / 1000);
    const result = standupStartV1(token, channelId, length);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 450);
    expect(result).toEqual({ finishTime: startTime + 0.3 });
  });

  test('Successful case: No messages sent', () => {
    standupStartV1(token, channelId, length);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 450);
    const result = channelMessagesV2(token, channelId, 0).messages;
    expect(result).toEqual([]);
  });
});
