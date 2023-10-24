import { getData } from './dataStore';
import { findUserWithToken, generateInvolvementRate, generateUtilizationRate, getTimeStamp, isValidToken } from './helper';
import { OutputUserStats, OutputWorkspaceStats } from './interface';
import HTTPError from 'http-errors';

/**
 * Gives back the users stats
 * @param token token of user requesting stats
 * @returns the users stats
 */
export function userStats(token:string): { userStats: OutputUserStats } {
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  const user = findUserWithToken(token);
  const userStats: OutputUserStats = {
    channelsJoined: user.userStats.channelsJoined,
    dmsJoined: user.userStats.dmsJoined,
    messagesSent: user.userStats.messagesSent,
    involvementRate: generateInvolvementRate(user),
  };
  return { userStats: userStats };
}

/**
 * Gives back workspace stats
 * @param token token of user requesting usersStats
 * @returns userStats in an workspaceStats
 */
export function usersStats(token:string): { workspaceStats: OutputWorkspaceStats} {
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  const data = getData();
  const workspaceStats = {
    channelsExist: data.workspaceStats.channelsExist,
    dmsExist: data.workspaceStats.dmsExist,
    messagesExist: data.workspaceStats.messagesExist,
    utilizationRate: generateUtilizationRate(),
  };
  return { workspaceStats: workspaceStats };
}
/**
 * Updates the users channel stats
 * @param uId uid of user changing their stats
 * @param type increases stat if join and decreases if leave
 * @returns empty object if successful
 */
export function addUserChannelStat(uId: number, type: ('join' | 'leave')) {
  const data = getData();
  const userIndex = data.users.findIndex(user => user.uId === uId);
  const user = data.users[userIndex];
  let newStat = user.userStats.channelsJoined[user.userStats.channelsJoined.length - 1].numChannelsJoined;
  if (type === 'join') {
    newStat += 1;
  } else {
    newStat += -1;
  }
  user.userStats.channelsJoined.push(
    {
      numChannelsJoined: newStat,
      timeStamp: getTimeStamp(),
    }
  );
  return {};
}

/**
 * Updates the users dm stats
 * @param uId uid of user changing their stats
 * @param type increases stat if join and decreases if leave
 * @returns empty object if successful
 */
export function addUserDmStat(uId: number, type: ('join' | 'leave')) {
  const data = getData();
  const userIndex = data.users.findIndex(user => user.uId === uId);
  const user = data.users[userIndex];
  let newStat = user.userStats.dmsJoined[user.userStats.dmsJoined.length - 1].numDmsJoined;
  if (type === 'join') {
    newStat += 1;
  } else {
    newStat += -1;
  }
  user.userStats.dmsJoined.push(
    {
      numDmsJoined: newStat,
      timeStamp: getTimeStamp(),
    }
  );
  return {};
}

/**
 * Updates the users message stats
 * @param uId uid of user changing their stats
 * @returns empty object if successful
 */
export function addUserMessageStat(uId: number) {
  const data = getData();
  const userIndex = data.users.findIndex(user => user.uId === uId);
  const user = data.users[userIndex];
  const newStat = user.userStats.messagesSent[user.userStats.messagesSent.length - 1].numMessagesSent + 1;
  user.userStats.messagesSent.push(
    {
      numMessagesSent: newStat,
      timeStamp: getTimeStamp(),
    }
  );
  return {};
}

/**
 * Updates workspace channel stat
 * @returns empty object if successful
 */
export function addWorkspaceChannelStat() {
  const data = getData();
  const newStat = data.workspaceStats.channelsExist[data.workspaceStats.channelsExist.length - 1].numChannelsExist + 1;
  data.workspaceStats.channelsExist.push(
    {
      numChannelsExist: newStat,
      timeStamp: getTimeStamp(),
    }
  );
  return {};
}

/**
 * Updates workspace channel stat
 * @param type whether increase in dms or decrease in dms
 * @returns empty object if successful
 */
export function addWorkspaceDmsStat(type: ('increase' | 'decrease')) {
  const data = getData();
  let newStat = data.workspaceStats.dmsExist[data.workspaceStats.dmsExist.length - 1].numDmsExist;
  if (type === 'increase') {
    newStat += 1;
  } else {
    newStat += -1;
  }
  data.workspaceStats.dmsExist.push(
    {
      numDmsExist: newStat,
      timeStamp: getTimeStamp(),
    }
  );
  return {};
}

/**
 * Updates workspace message stat
 * @param type whether increase in messages or decrease in dms
 * @param increment how much messages increased or decreased by
 * @returns empty object if successfully
 */
export function addWorkspaceMessagesStat(type: ('increase' | 'decrease')) {
  const data = getData();
  let newStat = data.workspaceStats.messagesExist[data.workspaceStats.messagesExist.length - 1].numMessagesExist;
  if (type === 'increase') {
    newStat += 1;
  } else {
    newStat += -1;
  }
  data.workspaceStats.messagesExist.push(
    {
      numMessagesExist: newStat,
      timeStamp: getTimeStamp(),
    }
  );
  return {};
}
