import express, { json, Request, Response } from 'express';
import { echo } from './echo';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import { dmCreateV1, dmRemoveV1, dmDetailsV1, dmListV1, dmLeaveV1, dmMessagesV1 } from './dm';
import { authLoginV3, authRegisterV3, authLogoutV2, authPasswordresetResetV1, authPasswordresetRequestV1 } from './auth';
import { messageSendV1, messageEditV1, messageRemoveV1, messageSendDmV1, messageShare, messageUnreact, messageReact, messagePin, messageUnpin, messageSendLater, messageSendLaterDm } from './messages';
import { userProfileV1, usersAllV1, userProfileSetnameV1, userProfileSetemailV1, userProfileSethandleV1, userProfileUploadPhotoV1 } from './users';
import { clearV1 } from './other';
import { channelInviteV3, channelMessagesV3, channelDetailsV1, channelJoinV1, channelLeaveV2, channelRemoveOwnerV2, channelAddOwnerV2 } from './channel';
import { channelsCreateV2, channelsListV2, channelsListAllV2 } from './channels';
import { adminUserRemoveV1, adminUserPermissionChangeV1 } from './admin';
import { standupStartV1, standupSendV1, standupActiveV1 } from './standup';
import { searchV1 } from './search';
import { loadData, uploadDefaultPhoto } from './dataStore';
import { notificationsGet } from './notifications';
import { usersStats, userStats } from './stats';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());

app.use('/static', express.static('static'));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

loadData();
uploadDefaultPhoto();
// Example get request
app.get('/echo', (req: Request, res: Response, next) => {
  try {
    const data = req.query.echo as string;
    return res.json(echo(data));
  } catch (err) {
    next(err);
  }
});

app.get('/search/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const queryStr = req.query.queryStr as string;
  res.json(searchV1(token, queryStr));
});

app.post('/auth/register/v3', (req: Request, res: Response) => {
  const email = req.body.email as string;
  const password = req.body.password as string;
  const nameFirst = req.body.nameFirst as string;
  const nameLast = req.body.nameLast as string;
  return res.json(authRegisterV3(email, password, nameFirst, nameLast));
});

app.post('/auth/login/v3', (req: Request, res: Response) => {
  const email = req.body.email as string;
  const password = req.body.password as string;
  return res.json(authLoginV3(email, password));
});

app.post('/auth/logout/v2', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  return res.json(authLogoutV2(token));
});

app.post('/auth/passwordreset/request/v1', (req: Request, res: Response) => {
  const email = req.body.email as string;
  return res.json(authPasswordresetRequestV1(email));
});

app.post('/auth/passwordreset/reset/v1', (req: Request, res: Response) => {
  const resetCode = req.body.resetCode as string;
  const newPassword = req.body.newPassword as string;
  return res.json(authPasswordresetResetV1(resetCode, newPassword));
});

app.delete('/admin/user/remove/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const uId = parseInt(req.query.uId as string);
  return res.json(adminUserRemoveV1(token, uId));
});

app.post('/admin/userpermission/change/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const uId = req.body.uId;
  const permissionId = req.body.permissionId;
  return res.json(adminUserPermissionChangeV1(token, uId, permissionId));
});

app.post('/channels/create/v3', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const name = req.body.name;
  const isPublic = req.body.isPublic;
  res.json(channelsCreateV2(token, name, isPublic));
});

app.get('/channels/list/v3', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  res.json(channelsListV2(token));
});

app.get('/channels/listAll/v3', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  res.json(channelsListAllV2(token));
});

app.get('/channel/details/V3', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const channelId = parseInt(req.query.channelId as string);
  res.json(channelDetailsV1(token, channelId));
});

app.post('/channel/join/v3', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const channelId = req.body.channelId;
  res.json(channelJoinV1(token, channelId));
});

app.get('/channel/messages/v3', (req, res) => {
  const token = String(req.header('token'));
  const channelId = Number(req.query.channelId);
  const start = Number(req.query.start);
  res.json(channelMessagesV3(token, channelId, start));
});

app.post('/channel/invite/v3', (req: Request, res: Response) => {
  const token = String(req.header('token'));
  const channelId = Number(req.body.channelId);
  const uId = Number(req.body.uId);
  res.json(channelInviteV3(token, channelId, uId));
});

app.post('/channel/leave/v2', (req, res) => {
  const token = req.header('token') as string;
  const channelId = req.body.channelId;
  res.json(channelLeaveV2(token, channelId));
});

app.post('/channel/addowner/v2', (req, res) => {
  const uId = req.body.uId;
  const token = req.header('token') as string;
  const channelId = req.body.channelId;
  res.json(channelAddOwnerV2(token, channelId, uId));
});

app.post('/channel/removeowner/v2', (req, res) => {
  const uId = req.body.uId;
  const token = req.header('token') as string;
  const channelId = req.body.channelId;
  res.json(channelRemoveOwnerV2(token, channelId, uId));
});

app.get('/standup/active/v1', (req, res) => {
  const token = req.header('token') as string;
  const channelId = Number(req.query.channelId);
  res.json(standupActiveV1(token, channelId));
});

app.post('/standup/start/v1', (req, res) => {
  const length = req.body.length;
  const token = req.header('token') as string;
  const channelId = req.body.channelId;
  res.json(standupStartV1(token, channelId, length));
});

app.post('/standup/send/v1', (req, res) => {
  const message = req.body.message;
  const token = req.header('token') as string;
  const channelId = req.body.channelId;
  res.json(standupSendV1(token, channelId, message));
});

app.post('/dm/create/v2', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const uIds = req.body.uIds;
  res.json(dmCreateV1(token, uIds));
});

app.get('/dm/list/v2', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  res.json(dmListV1(token));
});

app.delete('/dm/remove/v2', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const dmId = parseInt(req.query.dmId as string);
  res.json(dmRemoveV1(token, dmId));
});

app.get('/dm/details/v2', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const dmId = parseInt(req.query.dmId as string);
  res.json(dmDetailsV1(token, dmId));
});

app.post('/dm/leave/v2', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const dmId = parseInt(req.body.dmId);
  res.json(dmLeaveV1(token, dmId));
});

app.get('/dm/messages/v2', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const dmId = parseInt(req.query.dmId as string);
  const start = parseInt(req.query.start as string);
  res.json(dmMessagesV1(token, dmId, start));
});

app.get('/user/profile/v3', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const uId = parseInt(req.query.uId as string);
    return res.json(userProfileV1(token, uId));
  } catch (err) {
    next(err);
  }
});

app.get('/users/all/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    return res.json(usersAllV1(token));
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/setname/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const nameFirst = req.body.nameFirst as string;
    const nameLast = req.body.nameLast as string;
    return res.json(userProfileSetnameV1(token, nameFirst, nameLast));
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/setemail/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const email = req.body.email as string;
    return res.json(userProfileSetemailV1(token, email));
  } catch (err) {
    next(err);
  }
});

app.put('/user/profile/sethandle/v2', (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const handleStr = req.body.handleStr as string;
    return res.json(userProfileSethandleV1(token, handleStr));
  } catch (err) {
    next(err);
  }
});

app.get('/notifications/get/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  res.json(notificationsGet(token));
});

app.post('/message/send/v2', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const channelId = req.body.channelId as number;
  const message = req.body.message as string;
  return res.json(messageSendV1(token, channelId, message));
});

app.post('/message/senddm/v2', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  const dmId = req.body.dmId;
  const message = req.body.message;
  res.json(messageSendDmV1(token, dmId, message));
});

app.put('/message/edit/v2', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const messageId = req.body.messageId as number;
  const message = req.body.message as string;
  return res.json(messageEditV1(token, messageId, message));
});

app.delete('/message/remove/v2', (req: Request, res: Response, next) => {
  const token = req.header('token') as string;
  const messageId = req.query.messageId as string;
  return res.json(messageRemoveV1(token, +messageId));
});

app.post('/message/share/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { ogMessageId, message, channelId, dmId } = req.body;
  res.json(messageShare(token, ogMessageId, message, channelId, dmId));
});

app.post('/message/react/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { messageId, reactId } = req.body;
  return res.json(messageReact(token, messageId, reactId));
});

app.post('/message/unreact/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { messageId, reactId } = req.body;
  return res.json(messageUnreact(token, messageId, reactId));
});

app.post('/message/pin/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { messageId } = req.body;
  return res.json(messagePin(token, messageId));
});

app.post('/message/sendlater/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, message, timeSent } = req.body;
  res.json(messageSendLater(token, channelId, message, timeSent));
});

app.post('/message/sendlaterdm/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { dmId, message, timeSent } = req.body;
  res.json(messageSendLaterDm(token, dmId, message, timeSent));
});

app.post('/message/unpin/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { messageId } = req.body;
  return res.json(messageUnpin(token, messageId));
});

app.get('/user/stats/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  res.json(userStats(token));
});

app.get('/users/stats/v1', (req: Request, res: Response) => {
  const token = req.header('token') as string;
  res.json(usersStats(token));
});

app.post('/user/profile/uploadphoto/v1', async (req: Request, res: Response, next) => {
  try {
    const token = req.header('token') as string;
    const { imgUrl, xStart, yStart, xEnd, yEnd } = req.body;
    res.json(await userProfileUploadPhotoV1(token, imgUrl, xStart, yStart, xEnd, yEnd));
  } catch (error) {
    return next(error);
  }
});

app.delete('/clear/v1', (req: Request, res: Response, next) => {
  try {
    res.json(clearV1());
  } catch (err) {
    next(err);
  }
});

// handles errors nicely
app.use(errorHandler());

// for logging errors (print to terminal)
app.use(morgan('dev'));

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server listening on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
