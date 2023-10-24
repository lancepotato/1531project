import { findUserWithHandle, findUserWithToken, isValidHandleStr, isValidToken } from './helper';
import { channel, dm, Notification } from './interface';
import HTTPError from 'http-errors';
import { getData, setData } from './dataStore';

/**
 * Gets the users most recent 20 notifications
 * @param token token of user requesting notifications
 * @returns notifications object containing notifications array
 */
export function notificationsGet(token: string): { notifications: Notification[] } {
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  const userNotifications = findUserWithToken(token).notifications;
  const sliced = userNotifications.slice(0, 20);
  return { notifications: sliced };
}

/**
 * Generates the notification given details
 * @param senderHandle the handle on the user that caused the notification
 * @param chat the dm or channel of where the notification took place
 * @param type the type of notification
 * @param message optional message for tag notifications
 * @returns notification message
 */
function generateNotificationMessage(senderHandle: string, chat: (dm | channel), type: ('add' | 'tag' | 'react'), message?: string): string {
  let notificationMessage: string;
  if (type === 'add') {
    notificationMessage = `${senderHandle} added you to ${chat.name}`;
  }
  if (type === 'react') {
    notificationMessage = `${senderHandle} reacted to your message in ${chat.name}`;
  }
  if (type === 'tag') {
    const sliced = message.slice(0, 20);
    notificationMessage = `${senderHandle} tagged you in ${chat.name}: ${sliced}`;
  }
  return notificationMessage;
}

/**
 * Sends a notification from token to handles
 * @param token token of user sending notification
 * @param handles handles of users getting notified
 * @param chatType where the notification occurred
 * @param id id of dm or channel where notification occurred
 * @param type type of notification
 * @param message message if tag
 * @returns empty object if successful
 */
export function notificationSend(token: string, handles: string[], chatType: ('dms' | 'channels'), id: number, type: ('add' | 'tag' | 'react'), message?: string) {
  const data = getData();
  const sender = findUserWithToken(token);
  let chatId: string;
  let channelId = -1;
  let dmId = -1;
  if (chatType === 'channels') {
    chatId = 'channelId';
    channelId = id;
  } else {
    chatId = 'dmId';
    dmId = id;
  }
  const chatIndex = data[chatType].findIndex((chat: (dm | channel)) => chat[chatId] === id);
  const chat = data[chatType][chatIndex];
  for (const handle of handles) {
    const userIndex = data.users.findIndex(user => user.handleStr === handle);
    data.users[userIndex].notifications.unshift(
      {
        channelId: channelId,
        dmId: dmId,
        notificationMessage: generateNotificationMessage(sender.handleStr, chat, type, message),
      }
    );
  }
  setData(data);
  return {};
}

/**
 * Checks a message to determines valid tags in message
 * @param message message being sent
 * @param chat where message is sent
 * @returns all valid tags of message
 */
export function checkTags(message: string, chat: (dm | channel)): string[] {
  const words = message.split(/[^a-z0-9@]/);
  let tags = '';
  for (const word of words) {
    if (word.includes('@')) {
      tags = tags.concat(word);
    }
  }
  const tagsArray = tags.split('@');
  const validTags: string[] = [];
  for (const tag of tagsArray) {
    if (isValidHandleStr(tag) && chat.allMembers.includes(findUserWithHandle(tag).uId)) {
      validTags.push(tag);
    }
  }
  return Array.from(new Set(validTags));
}
