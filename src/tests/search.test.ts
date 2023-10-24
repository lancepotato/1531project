import { authRegisterV3, channelsCreateV2, clearV1, authLogoutV2, searchV1, dmCreateV1, messageSendV1, messageSendDmV1, channelJoinV2 } from './testHelperFunctions';
import { message } from '../interface';

describe('/search tests', () => {
  let token: string;
  let channelId: number;
  let user: number;

  beforeEach(() => {
    clearV1();
    token = authRegisterV3('johnsmith@gmail.com', '12345678', 'John', 'Smith').token;
    user = authRegisterV3('johnsmith2@gmail.com', '123456789', 'John1', 'Smith1').authUserId;
    channelId = channelsCreateV2(token, 'Channel', true).channelId;
  });

  test('Invalid token', () => {
    authLogoutV2(token);
    const result = searchV1(token, 'queryString');
    expect(result).toEqual({ code: 403, error: 'invalid token' });
  });

  test('Query string less than one', () => {
    const result = searchV1(token, '');
    expect(result).toEqual({ code: 400, error: 'Query string less than one' });
  });

  test('Query string more than 1000 characters', () => {
    const result = searchV1(token, 'A common question asked throughout the project is usually "How can I test this?" or "Can I test this?". In any situation, most things can be tested thoroughly. However, some things can only be tested sparsely, and on some other rare occasions, some things can\'t be tested at all. A challenge of this project is for you to use your discretion to figure out what to test, and how much to test. Often, you can use the functions you\'ve already written to test new functions in a black-box manner. The behaviour in which channelMessages returns data is called pagination. It\'s a commonly used method when it comes to getting theoretially unbounded amounts of data from a server to display on a page in chunks. Most of the timelines you know and love - Facebook, Instagram, LinkedIn - do this. Minor isolated fixes after the due date are allowed but carry a penalty to the automark, if the automark after re-running the autotests is greater than your initial automark. This penalty can be up to 30% of the automark for that iteration, depending on the number and nature of your fixes. Note that if the re-run automark after penalty is lower than your initial mark, we will keep your initial mark, meaning your automark cannot decrease after a re-run. E.g. imagine that your initial automark is 50%, on re-run you get a raw automark of 70%, and your fixes attract a 30% penalty: since the 30% penalty will reduce the mark of 70% to 49%, your final automark will still be 50% (i.e. your initial mark).');
    expect(result).toEqual({ code: 400, error: 'Query string more than 1000 characters' });
  });

  test('Successful cases ', () => {
    const dm = dmCreateV1(token, [user]);
    messageSendV1(token, channelId, 'I want to send uId a DM');
    messageSendDmV1(token, dm.dmId, 'I want to also search for a dm');
    messageSendDmV1(token, dm.dmId, 'There is no search word here');
    const result: message[] = searchV1(token, 'dm').messages;
    expect(result.length).toEqual(2);
    const oneWord: message[] = searchV1(token, 'word').messages;
    expect(oneWord.length).toEqual(1);
    const noWord: message[] = searchV1(token, 'notFound').messages;
    expect(noWord.length).toEqual(0);
    const upperCase: message[] = searchV1(token, 'WANT').messages;
    expect(upperCase.length).toEqual(2);
  });

  test('Successful cases: Multiple channels and dms and only joined channels', () => {
    const user2 = authRegisterV3('johnsmith4@gmail.com', '123456755', 'John14', 'Smith15');
    channelJoinV2(user2.token, channelId);
    const dm = dmCreateV1(token, [user]);
    const dm2 = dmCreateV1(token, [user2.authUserId]);
    const secondChannelId = channelsCreateV2(token, 'Channel2', true).channelId;
    const notJoinedChannel = channelsCreateV2(user2.token, 'Channel2', true).channelId;
    messageSendV1(token, channelId, 'I want to send uId a DM');
    messageSendV1(token, secondChannelId, 'I want to send uId a DM');
    messageSendV1(token, channelId, 'I want to send uId a DM');
    messageSendDmV1(token, dm.dmId, 'I want to also search for a dm');
    messageSendDmV1(token, dm2.dmId, 'There is search word here: dm');
    messageSendDmV1(token, dm.dmId, 'There is a search word here');
    messageSendV1(user2.token, notJoinedChannel, 'I want to send uId a DM');
    const result: message[] = searchV1(token, 'dm').messages;
    expect(result.length).toEqual(5);
  });

  test('Successful cases: search matches for all members in joined dm or channel not just authUser', () => {
    const user2 = authRegisterV3('johnsmith4@gmail.com', '123456755', 'John14', 'Smith15');
    channelJoinV2(user2.token, channelId);
    const dm = dmCreateV1(token, [user2.authUserId]);
    messageSendV1(token, channelId, 'I want to send uId a DM');
    messageSendDmV1(token, dm.dmId, 'There is search word here: dm');
    messageSendV1(user2.token, channelId, 'I want to send uId a DM');
    messageSendDmV1(user2.token, dm.dmId, 'I want to send uId a DM');
    const result: message[] = searchV1(token, 'dm').messages;
    expect(result.length).toEqual(4);
  });
});
