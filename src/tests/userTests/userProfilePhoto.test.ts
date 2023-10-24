import { authUserId } from '../../interface';
import { authRegisterV3, clearV1, userProfileUploadPhotoV1, userProfileV2 } from '../testHelperFunctions';
import { port, url } from '../../config.json';

let user1: authUserId;
let imgUrl: string;

beforeEach(() => {
  clearV1();
  user1 = authRegisterV3('jimjohnson@gmail.com', 'password1', 'Jim', 'Johnson');
  imgUrl = 'http://upload.wikimedia.org/wikipedia/commons/3/3a/Cat03.jpg'; // 1600 x 1598
});

describe('error cases', () => {
  test('Test when token is invalid', () => {
    const invalidToken = user1.token + 'a';
    expect(userProfileUploadPhotoV1(invalidToken, imgUrl, 0, 0, 100, 100)).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('xStart less than 0', () => {
    expect(userProfileUploadPhotoV1(user1.token, imgUrl, -20, 0, 1000, 1000)).toStrictEqual({ code: 400, error: 'invalid xStart' });
  });

  test('yStart less than 0', () => {
    expect(userProfileUploadPhotoV1(user1.token, imgUrl, 0, -20, 1000, 1000)).toStrictEqual({ code: 400, error: 'invalid yStart' });
  });

  test('Test xEnd is less than or equal to xStart', () => {
    expect(userProfileUploadPhotoV1(user1.token, imgUrl, 20, 50, 20, 100)).toStrictEqual({ code: 400, error: 'invalid xEnd' });
  });

  test('Test yEnd is less than or equal to yStart', () => {
    expect(userProfileUploadPhotoV1(user1.token, imgUrl, 50, 10, 100, 0)).toStrictEqual({ code: 400, error: 'invalid yEnd' });
  });

  test('Test image uploaded is not a JPG', () => {
    const invalidimgUrl = 'https://w7.pngwing.com/pngs/459/141/png-transparent-white-character-hollow-knight-team-cherry-nintendo-switch-minecraft-darkest-dungeon-glory-miscellaneous-head-video-game.png';
    expect(userProfileUploadPhotoV1(user1.token, invalidimgUrl, 10, 10, 50, 50)).toStrictEqual({ code: 400, error: 'image is not JPG' });
  });

  test('imgUrl is not an image', () => {
    expect(userProfileUploadPhotoV1(user1.token, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 0, 0, 500, 500)).toStrictEqual({ code: 400, error: 'Url is not an image' });
  });

  test('xEnd is bigger than image width', () => {
    expect(userProfileUploadPhotoV1(user1.token, imgUrl, 0, 0, 1700, 1000)).toStrictEqual({ code: 400, error: 'xEnd is bigger than image width' });
  });

  test('yEnd is bigger than image height', () => {
    expect(userProfileUploadPhotoV1(user1.token, imgUrl, 0, 0, 1400, 1700)).toStrictEqual({ code: 400, error: 'yEnd is bigger than image height' });
  });
});

describe('success case', () => {
  test('Test success to get and crop the image', () => {
    expect(userProfileUploadPhotoV1(user1.token, imgUrl, 10, 10, 100, 100)).toStrictEqual({});
    expect(userProfileV2(user1.token, user1.authUserId).user.profileImgUrl).toStrictEqual(`${url}:${port}/static/photos/${user1.authUserId}.jpg`);
  });
});
