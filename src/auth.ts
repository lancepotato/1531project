import { getData, setData } from './dataStore';
import validator from 'validator';
import { createToken } from './token';
import { authUserId, dataStore, error, UserStats } from './interface';
import HTTPError from 'http-errors';
import { getHashOf, getHashOfToken, getTimeStamp } from './helper';
import { url, port } from './config.json';

/**
 * Takes an email, password and your name and registers you
 * @param {string} email
 * @param {string} password
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns returns your user ID and a token as long as the inputs are valid
 */
function authRegisterV3(email: string, password: string, nameFirst: string, nameLast: string): authUserId | error {
  const data = getData();
  const numbUsers = data.users.length;
  if (validator.isEmail(email) === false) {
    throw HTTPError(400, 'invalid email address');
  }
  for (const i in data.users) {
    if (email === data.users[i].email) {
      throw HTTPError(400, 'email address already in use');
    }
  }
  const hndstr = makeHandleStr(data, nameFirst, nameLast);
  if (password.length < 6) {
    throw HTTPError(400, 'password must be at least 6 characters long');
  }
  if (nameFirst.length > 50 || nameFirst.length < 1) {
    throw HTTPError(400, 'please enter a first name between 1 and 50 characters (inclusive)');
  }
  if (nameLast.length > 50 || nameLast.length < 1) {
    throw HTTPError(400, 'please enter a Last name between 1 and 50 characters (inclusive)');
  }
  let permissionId = 2;
  if (data.users.length === 0) {
    permissionId = 1;
    data.workspaceStats = {
      channelsExist: [{ numChannelsExist: 0, timeStamp: getTimeStamp() }],
      dmsExist: [{ numDmsExist: 0, timeStamp: getTimeStamp() }],
      messagesExist: [{ numMessagesExist: 0, timeStamp: getTimeStamp() }],
    };
  }
  const token = createToken();
  const hashedToken = getHashOfToken(token);
  const hashedPassword = getHashOf(password);
  const userStats: UserStats = {
    channelsJoined: [{ numChannelsJoined: 0, timeStamp: getTimeStamp() }],
    dmsJoined: [{ numDmsJoined: 0, timeStamp: getTimeStamp() }],
    messagesSent: [{ numMessagesSent: 0, timeStamp: getTimeStamp() }],
  };
  data.users.push({
    permissionId: permissionId,
    email: email,
    uId: numbUsers,
    password: hashedPassword,
    nameFirst: nameFirst,
    nameLast: nameLast,
    handleStr: hndstr,
    tokens: [token],
    profileImgUrl: `${url}:${port}/static/photos/default.jpg`,
    isRemoved: false,
    passwordResetCode: '',
    notifications: [],
    userStats: userStats
  });
  setData(data);
  return {
    authUserId: numbUsers,
    token: hashedToken,
  };
}

/**
 * Converts the first and last name into a lowercase non-alphanumeric handle string
 * @param {object} data
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns a string to be used as a handle string
 */
function makeHandleStr(data: dataStore, nameFirst: string, nameLast: string): string {
  let handleChanger = 0;
  let hndstr = nameFirst.toLowerCase() + nameLast.toLowerCase();
  let toSlice;
  hndstr = hndstr.replace(/[^a-z0-9]/g, '');
  if (hndstr.length > 20) {
    hndstr = hndstr.slice(0, 20);
  }
  for (const i in data.users) {
    if (hndstr === data.users[i].handleStr) {
      if (handleChanger > 0) {
        toSlice = String(handleChanger).length;
        hndstr = hndstr.slice(0, -toSlice);
      }
      hndstr = hndstr + String(handleChanger);
      handleChanger++;
    }
  }
  return hndstr;
}

/**
 * Logs you in if you have the correct email and password
 * @param {string} email
 * @param {string} password
 * @returns returns your user ID and a token as long as the password and email is correct
 */
function authLoginV3(email: string, password: string): authUserId| error {
  const data = getData();
  if (validator.isEmail(email) === false) {
    throw HTTPError(400, 'invalid email address');
  }
  for (const index in data.users) {
    if (email === data.users[index].email) {
      if (getHashOf(password) !== data.users[index].password) {
        throw HTTPError(400, 'incorrect password');
      } else {
        const newTok = createToken();
        const hashedToken = getHashOfToken(newTok);
        data.users[index].tokens.push(newTok);
        setData(data);
        return {
          authUserId: data.users[index].uId,
          token: hashedToken
        };
      }
    }
  }
  throw HTTPError(400, 'email does not belong to a user');
}

/**
 * removes token to end user's session
 * @param {string} token token of user that is trying to log out
 * @returns empty object when success and error if token is not found
 */
function authLogoutV2(token: string): { error: string } | Record<string, never> {
  const data = getData();
  let foundIndex = false;
  let indexCounter = 0;
  for (const users of data.users) {
    indexCounter = 0;
    for (const login of users.tokens) {
      if (token === getHashOfToken(login)) {
        foundIndex = true;
        users.tokens.splice(indexCounter, 1);
        setData(data);
        return {};
      }
      indexCounter++;
    }
  }
  if (foundIndex === false) {
    throw HTTPError(403, 'invalid token');
  }
}

/**
 * This function emails a user a code to use input into authPasswordresetReset to change their password
 * @param {string} email the email for the request to be sent to
 * @returns empty object, however they should recieve an email shortly after with the code
 */
function authPasswordresetRequestV1(email: string): Record<string, never> {
  const data = getData();
  let isValidEm = false;
  const resetCode = createToken(); // this is a randomly generated string of length 6
  for (const user of data.users) {
    if (email === user.email) {
      isValidEm = true;
      user.passwordResetCode = resetCode;
      user.tokens = [];
    }
  }
  if (isValidEm === false) {
    return {};
  }

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
      user: 'aerrorplane@hotmail.com',
      pass: 'iloveComp1531',
    }
  });

  const mailOptions = {
    from: 'aerrorplane@hotmail.com',
    to: `${email}`,
    subject: 'Email reset code for Beans',
    text: `${resetCode}`
  };

  transporter.sendMail(mailOptions);

  setData(data);
  return {};
}

/**
 * This function changes a user's password to whatever they inserted into the function
 * @param {string} resetCode the code to enter to be able to reset the password
 * @param {string} newPassword the new password to use to unlock the account
 * @returns Either an empty object (if done correctly) or an error. If done correctly, it should change the password for the the account
 */
function authPasswordresetResetV1(resetCode: string, newPassword: string): { error: string } | Record<string, never> {
  const data = getData();
  if (newPassword.length < 6) {
    throw HTTPError(400, 'Password must be at least 6 characters long');
  }
  for (const users of data.users) {
    if (resetCode === users.passwordResetCode) {
      users.password = getHashOf(newPassword);
      users.passwordResetCode = '';
      setData(data);
      return {};
    }
  }
  throw HTTPError(400, 'invalid reset code');
}

export { authLoginV3, authRegisterV3, authLogoutV2, authPasswordresetRequestV1, authPasswordresetResetV1 };
