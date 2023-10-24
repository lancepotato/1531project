import { authUserId } from '../../interface';
import { adminUserRemoveV1, adminUserPermissionChangeV1, authRegisterV3, channelDetailsV2, dmDetailsV1, channelsCreateV2, channelJoinV2, dmCreateV1, usersAllV1, channelAddOwnerV1, userProfileV2, messageSendDmV1, messageSendV1, clearV1, channelMessagesV2, dmMessagesV1 } from '../testHelperFunctions';

let globReg: authUserId;
let userReg: authUserId;
let chanOwnerReg: authUserId;
let chanOwner2Reg: authUserId;
let channelNumb: number;
let dm1: number;
let dm2: number;
let nameAr: string[];

beforeEach(() => {
  clearV1();

  // setting up the global owner
  globReg = authRegisterV3('globowner@internode.com', 'monkey', 'Mon', 'Key');

  // setting up the admin's channel
  chanOwnerReg = authRegisterV3('zaciscool@gmail.com', '12345678', 'Zac', 'Albert');
  channelNumb = channelsCreateV2(chanOwnerReg.token, 'zac', true).channelId;
  channelJoinV2(globReg.token, channelNumb);
  channelAddOwnerV1(globReg.token, channelNumb, globReg.authUserId);
  messageSendV1(chanOwnerReg.token, channelNumb, 'Ash won');

  // setting up a second admin
  chanOwner2Reg = authRegisterV3('beans@outlook.com', 'boinky', 'Be', 'Ans');
  channelJoinV2(chanOwner2Reg.token, channelNumb);
  channelAddOwnerV1(chanOwnerReg.token, channelNumb, chanOwner2Reg.authUserId);
  messageSendV1(chanOwner2Reg.token, channelNumb, 'Digimon is better');
  dm1 = dmCreateV1(chanOwnerReg.token, [chanOwner2Reg.authUserId, globReg.authUserId]).dmId;
  messageSendDmV1(chanOwnerReg.token, dm1, 'Birb');
  messageSendDmV1(chanOwner2Reg.token, dm1, 'Borb');

  // setting up the user
  userReg = authRegisterV3('zacsmells@gmail.com', 'abcdefg', 'Al', 'Bert');
  channelJoinV2(userReg.token, channelNumb);
  messageSendV1(userReg.token, channelNumb, 'I can beat him');
  dm2 = dmCreateV1(userReg.token, [globReg.authUserId]).dmId;
  messageSendDmV1(userReg.token, dm2, 'Monke');
  messageSendDmV1(globReg.token, dm2, ':0');

  nameAr = [];
});

describe('Error cases', () => {
  test('invalid token', () => {
    const invalidToken = globReg.token + chanOwnerReg.token + chanOwner2Reg.token + userReg.token;
    expect(adminUserRemoveV1(invalidToken, userReg.authUserId)).toStrictEqual({ code: 403, error: 'invalid token' });
  });

  test('The uId used does not refer to a valid user', () => {
    expect(adminUserRemoveV1(globReg.token, userReg.authUserId + 33)).toStrictEqual({ code: 400, error: 'invalid uId' });
  });

  test('The uId is of the only global owner', () => { // GO CAN REMOVE ANOTHER GO. REDO?
    // Please note that no other global owner was made in the set-up
    expect(adminUserRemoveV1(globReg.token, globReg.authUserId)).toStrictEqual({ code: 400, error: 'Cannot remove the only global owner' });
  });

  test('The authorised user is not a global owner', () => {
    // Please note that if an invalid user tried to run this function it would still not work
    // because only the global owner can use this. Therefore it was not tested for invalid tokens
    expect(adminUserRemoveV1(chanOwnerReg.token, userReg.authUserId)).toStrictEqual({ code: 403, error: 'Only the global owner has permission' });
  });
});

describe('Success cases', () => {
  test('The function can work when given the correct inputs', () => {
    expect(adminUserRemoveV1(globReg.token, userReg.authUserId)).toStrictEqual({});
    const userList = usersAllV1(globReg.token);
    for (const user of userList.users) {
      nameAr.push(user.nameFirst);
    }
    expect(nameAr).toStrictEqual(['Mon', 'Zac', 'Be']);
    expect(channelMessagesV2(chanOwnerReg.token, channelNumb, 0).messages[0].message).toStrictEqual('Removed user');
    expect(userProfileV2(globReg.token, userReg.authUserId).user).toStrictEqual({
      uId: userReg.authUserId,
      email: '',
      nameFirst: 'Removed',
      nameLast: 'user',
      handleStr: '',
      profileImgUrl: expect.any(String),
    });
    const channelDetails = channelDetailsV2(globReg.token, channelNumb);
    const channelAllMembers = new Set(channelDetails.allMembers);
    const channelOwnerMembers = new Set(channelDetails.ownerMembers);
    expect(channelAllMembers).toStrictEqual(new Set(
      [
        {
          email: 'zaciscool@gmail.com',
          handleStr: 'zacalbert',
          nameFirst: 'Zac',
          nameLast: 'Albert',
          uId: chanOwnerReg.authUserId,
          profileImgUrl: expect.any(String),
        },
        {
          email: 'globowner@internode.com',
          handleStr: 'monkey',
          nameFirst: 'Mon',
          nameLast: 'Key',
          uId: globReg.authUserId,
          profileImgUrl: expect.any(String),
        },
        {
          email: 'beans@outlook.com',
          handleStr: 'beans',
          nameFirst: 'Be',
          nameLast: 'Ans',
          uId: chanOwner2Reg.authUserId,
          profileImgUrl: expect.any(String),
        }
      ]
    ));
    expect(channelOwnerMembers).toStrictEqual(new Set(
      [
        {
          email: 'zaciscool@gmail.com',
          handleStr: 'zacalbert',
          nameFirst: 'Zac',
          nameLast: 'Albert',
          uId: chanOwnerReg.authUserId,
          profileImgUrl: expect.any(String),
        },
        {
          email: 'globowner@internode.com',
          handleStr: 'monkey',
          nameFirst: 'Mon',
          nameLast: 'Key',
          uId: globReg.authUserId,
          profileImgUrl: expect.any(String),
        },
        {
          email: 'beans@outlook.com',
          handleStr: 'beans',
          nameFirst: 'Be',
          nameLast: 'Ans',
          uId: chanOwner2Reg.authUserId,
          profileImgUrl: expect.any(String),
        }
      ]
    ));
  });

  test('An original first owner can be removed', () => {
    expect(adminUserRemoveV1(globReg.token, chanOwnerReg.authUserId)).toStrictEqual({});
    const userList = usersAllV1(globReg.token);
    for (const user of userList.users) {
      nameAr.push(user.nameFirst);
    }
    expect(nameAr).toStrictEqual(['Mon', 'Be', 'Al']);
    expect(channelMessagesV2(globReg.token, channelNumb, 0).messages[2].message).toStrictEqual('Removed user');
    expect(dmMessagesV1(globReg.token, dm1, 0).messages[1].message).toStrictEqual('Removed user');
    const channelDetails = channelDetailsV2(globReg.token, channelNumb);
    const channelAllMembers = new Set(channelDetails.allMembers);
    const channelOwnerMembers = new Set(channelDetails.ownerMembers);
    expect(channelAllMembers).toStrictEqual(new Set(
      [
        {
          email: 'zacsmells@gmail.com',
          handleStr: 'albert',
          nameFirst: 'Al',
          nameLast: 'Bert',
          uId: userReg.authUserId,
          profileImgUrl: expect.any(String),
        },
        {
          email: 'globowner@internode.com',
          handleStr: 'monkey',
          nameFirst: 'Mon',
          nameLast: 'Key',
          uId: globReg.authUserId,
          profileImgUrl: expect.any(String),
        },
        {
          email: 'beans@outlook.com',
          handleStr: 'beans',
          nameFirst: 'Be',
          nameLast: 'Ans',
          uId: chanOwner2Reg.authUserId,
          profileImgUrl: expect.any(String),
        }
      ]
    ));
    expect(channelOwnerMembers).toStrictEqual(new Set(
      [
        {
          email: 'beans@outlook.com',
          handleStr: 'beans',
          nameFirst: 'Be',
          nameLast: 'Ans',
          uId: chanOwner2Reg.authUserId,
          profileImgUrl: expect.any(String),
        },
        {
          email: 'globowner@internode.com',
          handleStr: 'monkey',
          nameFirst: 'Mon',
          nameLast: 'Key',
          uId: globReg.authUserId,
          profileImgUrl: expect.any(String),
        }
      ]
    ));
    const dmDetails = dmDetailsV1(globReg.token, dm1);
    const dmAllMembers = new Set(dmDetails.members);
    expect(dmAllMembers).toStrictEqual(new Set(
      [
        {
          email: 'beans@outlook.com',
          handleStr: 'beans',
          nameFirst: 'Be',
          nameLast: 'Ans',
          uId: chanOwner2Reg.authUserId,
          profileImgUrl: expect.any(String),
        },
        {
          email: 'globowner@internode.com',
          handleStr: 'monkey',
          nameFirst: 'Mon',
          nameLast: 'Key',
          uId: 0,
          profileImgUrl: expect.any(String),
        }
      ]
    ));
  });

  test('A global owner can remove another global owner', () => {
    messageSendV1(globReg.token, channelNumb, 'I am alone');
    adminUserPermissionChangeV1(globReg.token, userReg.authUserId, 1);
    expect(adminUserRemoveV1(userReg.token, globReg.authUserId)).toStrictEqual({});
    const userList = usersAllV1(userReg.token);
    for (const user of userList.users) {
      nameAr.push(user.nameFirst);
    }
    expect(nameAr).toStrictEqual(['Zac', 'Be', 'Al']);
    // expect(data.channels[2].messages).toStrictEqual(['Removed user']);
    expect(channelMessagesV2(userReg.token, channelNumb, 0).messages[0].message).toStrictEqual('Removed user');
    expect(dmMessagesV1(userReg.token, dm2, 0).messages[0].message).toStrictEqual('Removed user');
  });
});
