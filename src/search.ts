import { getData } from './dataStore';
import { isValidToken, isMember, findUserWithToken, isDmMember, createOutputMessages } from './helper';
import { message, OutputMessage, error } from './interface';
import HTTPError from 'http-errors';

/**
* searchV1
* Returns messages from channel/dm that contain query
*
* Arguments:
*   token - string
*   querystr - string - query to be found
*
* Return Value:
*   403 error    - token invalid
*   400 error    - any other error
*   { messages } - Successful case
*/
export function searchV1(token: string, queryStr: string): error | { messages: OutputMessage[] } {
  const data = getData();
  const outputArray: message[] = [];

  // Validate token
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }

  // Query String less than one
  if (queryStr.length <= 0) {
    throw HTTPError(400, 'Query string less than one');
  }

  // Query String more than 1000 chars
  if (queryStr.length >= 1000) {
    throw HTTPError(400, 'Query string more than 1000 characters');
  }
  const user = findUserWithToken(token);

  for (const channel of data.channels) {
    if (isMember(user.uId, channel.channelId)) {
      for (const message of channel.messages) {
        if (message.message.toLowerCase().includes(queryStr.toLowerCase())) {
          outputArray.push(message);
        }
      }
    }
  }

  for (const dms of data.dms) {
    if (isDmMember(user.uId, dms.dmId)) {
      for (const message of dms.messages) {
        if (message.message.toLowerCase().includes(queryStr.toLowerCase())) {
          outputArray.push(message);
        }
      }
    }
  }
  const messages: OutputMessage[] = createOutputMessages(token, outputArray);
  return { messages };
}
