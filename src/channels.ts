import { getData, setData } from './dataStore';
import { channelId, channelsList, error } from './interface';
import { findUserWithToken, isValidToken } from './helper';
import HTTPError from 'http-errors';
import { addUserChannelStat, addWorkspaceChannelStat } from './stats';

/**
 * Provides an array of all channels that the authorised user is part of.
 * @param {string} token user token
 * @returns {{channels: array}} object that contains an array
 */
function channelsListV2(token: string): channelsList | error {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  const uId = findUserWithToken(token).uId;

  const channels = [];

  for (let i = 0; i < data.channels.length; i++) {
    if (data.channels[i].allMembers.includes(uId) === true) {
      channels.push(
        {
          channelId: data.channels[i].channelId,
          name: data.channels[i].name
        }
      );
    }
  }

  return { channels };
}

/**
 * Provides an array of all channels, including private channels (and their associated details)
 * @param {string} token user token
 * @returns {{channels: array}} object that contains an array
 */
function channelsListAllV2(token: string): channelsList | error {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  const channels = [];

  for (const index in data.channels) {
    channels.push(
      {
        channelId: data.channels[index].channelId,
        name: data.channels[index].name,
      }
    );
  }

  return { channels };
}

/**
 * Creates a new channel with the given name and type. The user who creates the channel
 * will automatically join it as an owner.
 * @param {string} token user token
 * @param {string} name name of the channel
 * @param {boolean} isPublic whether channel is public or private
 * @returns {{channelId: number}} {channelId} (object)
 */
function channelsCreateV2(token: string, name: string, isPublic: boolean): channelId | error {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  if (name.length < 1 || name.length > 20) {
    throw HTTPError(400, 'invalid name');
  }

  const uId = findUserWithToken(token).uId;
  const givenId = data.channels.length;

  data.channels.push(
    {
      channelId: givenId,
      name: name,
      isPublic: isPublic,
      ownerMembers: [uId],
      allMembers: [uId],
      messages: [],
      standupActive: { isStandupActive: false },
      standupMessage: [],
    }
  );
  addUserChannelStat(uId, 'join');
  addWorkspaceChannelStat();
  setData(data);

  return { channelId: givenId };
}

export { channelsListV2, channelsListAllV2, channelsCreateV2 };
