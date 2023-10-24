export interface Notification {
  channelId: number,
  dmId: number,
  notificationMessage: string,
}

export interface ChannelsJoined {
  numChannelsJoined: number,
  timeStamp: number,
}
export interface DmsJoined {
  numDmsJoined: number,
  timeStamp: number,
}
export interface MessagesSent {
  numMessagesSent: number,
  timeStamp: number,
}
export interface ChannelsExist {
  numChannelsExist: number,
  timeStamp: number,
}
export interface DmsExist {
  numDmsExist: number,
  timeStamp: number,
}
export interface MessagesExist {
  numMessagesExist: number,
  timeStamp: number,
}
export interface UserStats{
  channelsJoined: ChannelsJoined[],
  dmsJoined: DmsJoined[],
  messagesSent: MessagesSent[],
}
export interface WorkspaceStats{
  channelsExist: ChannelsExist[],
  dmsExist: DmsExist[],
  messagesExist: MessagesExist[],
}
export interface user {
  permissionId: number,
  email: string,
  uId: number,
  password: string,
  nameFirst: string,
  nameLast: string,
  handleStr: string,
  tokens: string[],
  profileImgUrl: string,
  isRemoved: boolean
  passwordResetCode: string
  notifications: Notification[],
  userStats: UserStats,
}

export interface React {
  reactId: number,
  uIds: number[],
}

export interface OutputReact {
  reactId: number,
  uIds: number[],
  isThisUserReacted: boolean,
}

export interface message {
  messageId: number,
  uId: number,
  message: string,
  timeSent: number,
  reacts: React[],
  isPinned: boolean,
}

export interface OutputMessage {
  messageId: number,
  uId: number,
  message: string,
  timeSent: number,
  reacts: OutputReact[],
  isPinned: boolean,
}
export interface usersList {
  users: Array<{
    uId: number,
    email: string,
    nameFirst: string,
    nameLast: string,
    handleStr: string,
  }>
}

export interface channel {
  channelId: number,
  name: string,
  isPublic: boolean,
  ownerMembers: number[],
  allMembers: number[],
  messages: message[],
  standupActive : { isStandupActive: boolean, timeStandupFinish?: number, user?: number };
  standupMessage : string[];
}

export interface dm {
  dmId: number,
  name: string,
  creator: number,
  ownerMembers: number[],
  allMembers: number[],
  messages: message[],
}

export interface dataStore {
  users: user[],
  channels: channel[],
  dms: dm[],
  messageCounter: number,
  workspaceStats: WorkspaceStats
}

export interface error {
  error: string,
}

export interface authUserId {
  authUserId: number,
  token: string
}

export interface channelsList {
  channels: Array<{
    channelId: number,
    name: string,
  }>
}

export interface channelId {
  channelId: number;
  error?: undefined;
}

export interface profile {
  user: {
    uId : number;
    email: string;
    nameFirst: string;
    nameLast: string;
    handleStr: string;
    profileImgUrl: string;
  }
}

export interface outUser {
  uId: number,
  email: string,
  nameFirst: string,
  nameLast: string,
  handleStr: string,
}

export interface channelDetails {
  name: string,
  isPublic: boolean,
  ownerMembers: outUser[],
  allMembers: outUser[],
}

export interface messages {
  messages: Array<message>;
  start: number;
  end: number;
}

export interface dmId {
  dmId: number,
}

export interface dmsList {
  dms: Array<{
    dmId: number,
    name: string,
  }>
}

export interface dmDetail {
  name: string,
  members: outUser[],
}

export interface messageId {
  messageId: number,
}

export interface MessageLocation {
  type: ('channels' | 'dms'),
  chatIndex: number,
  messageIndex: number,
}

export interface SharedMessageId {
  sharedMessageId: number,
}

export interface OutputUserStats {
  channelsJoined: ChannelsJoined[],
  dmsJoined: DmsJoined[],
  messagesSent: MessagesSent[],
  involvementRate: number,
}

export interface OutputWorkspaceStats {
  channelsExist: ChannelsExist[],
  dmsExist: DmsExist[],
  messagesExist: MessagesExist[],
  utilizationRate: number,
}
