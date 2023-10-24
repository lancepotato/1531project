import { getData, setData } from './dataStore';
import { usersList, profile, error } from './interface';
import { isValidToken, isValidUid, findUserWithToken } from './helper';
import validator from 'validator';
import HTTPError from 'http-errors';
import request, { Response } from 'sync-request';
import fs from 'fs';
import { port, url } from './config.json';
import sharp from 'sharp';

/**
 * For a valid user, returns information about their userId, email, first name, last name, and handle
 * @param token user token
 * @param uId uId of user to be viewed
 * @returns profile when token and uId are invalid
 */
export function userProfileV1(token: string, uId: number): profile | error {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  if (!isValidUid(uId)) {
    throw HTTPError(400, 'Invalid uId');
  }

  const user = data.users.find(user => user.uId === uId);
  const profile: profile = {
    user: {
      uId: user.uId,
      email: user.email,
      nameFirst: user.nameFirst,
      nameLast: user.nameLast,
      handleStr: user.handleStr,
      profileImgUrl: user.profileImgUrl
    }
  };

  return profile;
}

/**
 * Returns a list of all users and their associated details
 * @param token user token
 * @returns usersList when token is invalid
 */
export function usersAllV1(token: string): usersList | error {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const usersList: usersList = {
    users: []
  };

  for (const user of data.users) {
    if (user.isRemoved === false) {
      usersList.users.push(
        {
          uId: user.uId,
          email: user.email,
          nameFirst: user.nameFirst,
          nameLast: user.nameLast,
          handleStr: user.handleStr,
        }
      );
    }
  }

  return usersList;
}

/**
 * Update the authorised user's first and last name
 * @param token user token
 * @param nameFirst new nameFirst
 * @param nameLast new nameLast
 * @returns empty object when token, nameFirst and namelast are invalid
 */
export function userProfileSetnameV1(token: string, nameFirst: string, nameLast: string): error | Record<string, never> {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  if (nameFirst.length < 1 || nameFirst.length > 50) {
    throw HTTPError(400, 'Invalid nameFirst');
  }

  if (nameLast.length < 1 || nameLast.length > 50) {
    throw HTTPError(400, 'Invalid nameLast');
  }

  const found = findUserWithToken(token);
  found.nameFirst = nameFirst;
  found.nameLast = nameLast;

  setData(data);
  return {};
}

/**
 * Update the authorised user's email address
 * @param token user token
 * @param email new email address
 * @returns empty object when token and email are invalid
 */
export function userProfileSetemailV1(token: string, email: string): error | Record<string, never> {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  if (validator.isEmail(email) === false) {
    throw HTTPError(400, 'Invalid email address');
  }

  for (const i in data.users) {
    if (email === data.users[i].email) {
      throw HTTPError(400, 'email address is already being used');
    }
  }

  const found = findUserWithToken(token);
  found.email = email;

  setData(data);
  return {};
}

/**
 * Update the authorised user's handle (i.e. display name)
 * @param token user token
 * @param handleStr new handleStr
 * @returns empty object when token and handleStr are invalid
 */
export function userProfileSethandleV1(token: string, handleStr: string): error | Record<string, never> {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  if (handleStr.length < 3) {
    throw HTTPError(400, 'Invalid handleStr');
  }

  if (handleStr.length > 20) {
    throw HTTPError(400, 'Invalid handleStr');
  }

  if (handleStr.match(/[^a-z0-9]/gi) !== null) {
    throw HTTPError(400, 'handleStr should be alphanumeric');
  }

  for (const i in data.users) {
    if (handleStr === data.users[i].handleStr) {
      throw HTTPError(400, 'handle is already being used');
    }
  }

  const found = findUserWithToken(token);
  found.handleStr = handleStr;

  setData(data);
  return {};
}

/**
 * given an imgUrl, uploads and crops the image, then assigns the saved url of the cropeed image to the user
 * @param token token of the user
 * @param imgUrl http url of the image
 * @param xStart starting x position of crop
 * @param yStart starting y position of crop
 * @param xEnd ending x position of crop
 * @param yEnd ending y position of crop
 * @returns empty object
 */
export async function userProfileUploadPhotoV1(token: string, imgUrl: string, xStart: number, yStart: number, xEnd: number, yEnd: number) {
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid token');
  }
  if (xStart < 0) {
    throw HTTPError(400, 'invalid xStart');
  }
  if (yStart < 0) {
    throw HTTPError(400, 'invalid yStart');
  }
  if (xEnd <= xStart) {
    throw HTTPError(400, 'invalid xEnd');
  }
  if (yEnd <= yStart) {
    throw HTTPError(400, 'invalid yEnd');
  }

  let res: Response;
  try {
    res = request('GET', imgUrl);
  } catch {
    throw HTTPError(400, 'error retrieving image');
  }

  let image: sharp.Sharp;
  let metadata: sharp.Metadata;

  try {
    image = sharp(res.getBody());
    metadata = await image.metadata();
  } catch {
    throw HTTPError(400, 'Url is not an image');
  }

  if (xEnd > metadata.width) {
    throw HTTPError(400, 'xEnd is bigger than image width');
  }
  if (yEnd > metadata.height) {
    throw HTTPError(400, 'yEnd is bigger than image height');
  }
  if (metadata.format !== 'jpeg' && metadata.format !== 'jpg') {
    throw HTTPError(400, 'image is not JPG');
  }

  const folder = './static';
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const user = findUserWithToken(token);
  const width = xEnd - xStart;
  const height = yEnd - yStart;
  // crop the image
  image
    .extract({
      width: width,
      height: height,
      left: xStart,
      top: yStart
    })
    .jpeg()
    .toFile(`${folder}/${user.uId}.jpg`);
  user.profileImgUrl = `${url}:${port}/static/photos/${user.uId}.jpg`;
  return {};
}
