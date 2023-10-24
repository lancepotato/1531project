import { authLogoutV2, authRegisterV3, channelsCreateV2, clearV1, standupStartV1, standupActiveV1 } from '../testHelperFunctions';

describe('/standup/active tests', () => {
  let token: string;
  let channelId: number;
  let length: number;

  beforeEach(() => {
    clearV1();
    token = authRegisterV3('johnsmith@gmail.com', '12345678', 'John', 'Smith').token;
    channelId = channelsCreateV2(token, 'Channel', true).channelId;
    length = 0.5;
  });

  test('Invalid token', () => {
    authLogoutV2(token);
    standupStartV1(token, channelId, length);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 750);
    const result = standupActiveV1(token, channelId);
    expect(result).toEqual({ code: 403, error: 'invalid token' });
  });

  test('Invalid channelId', () => {
    standupStartV1(token, channelId, length);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 750);
    const result = standupActiveV1(token, channelId + 1);
    expect(result).toEqual({ code: 400, error: 'invalid channelId' });
  });

  test('Authorised user not a member of channel', () => {
    const invalid = authRegisterV3('invalid@gmail.com', '1234567', 'Invalid', 'User').token;
    standupStartV1(token, channelId, length);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 750);
    const result = standupActiveV1(invalid, channelId);
    expect(result).toEqual({ code: 403, error: 'User is not a member of channel' });
  });

  test('Successful case: No active standup', () => {
    const result = standupActiveV1(token, channelId);
    expect(result).toEqual({ isActive: false, timeFinish: null });
  });

  test('Successful case: Active standup', () => {
    const finishTime: { finishTime: number } = standupStartV1(token, channelId, 1);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 750);
    const result = standupActiveV1(token, channelId);
    expect(result).toEqual({ isActive: true, timeFinish: finishTime.finishTime });
  });
});
