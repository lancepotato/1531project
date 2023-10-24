import { dataStore } from './interface';
import fs from 'fs';
import request, { Response } from 'sync-request';
import HTTPError from 'http-errors';

// YOU SHOULD MODIFY THIS OBJECT BELOW

let data: dataStore = {
  users: [],
  channels: [],
  dms: [],
  messageCounter: 0,
  workspaceStats: {
    channelsExist: [],
    dmsExist: [],
    messagesExist: [],
  },
};

// Use get() to access the data
function getData(): dataStore {
  return data;
}

// Use set(newData) to pass in the entire data object, with modifications made
function setData(newData: dataStore) {
  data = newData;
  const dataOut = JSON.stringify(newData, null, 2);
  fs.writeFileSync('./data.json', dataOut, { flag: 'w' });
}

function loadData(): dataStore {
  if (fs.existsSync('./data.json')) {
    const data = JSON.parse(String(fs.readFileSync('./data.json')));
    setData(data);
  }
  return data;
}

function uploadDefaultPhoto() {
  let res: Response;
  try {
    res = request(
      'GET',
      'https://pbs.twimg.com/media/Eweus03VkAMdrCi.jpg'
    );
  } catch {
    throw HTTPError(400, 'Unable to get image');
  }

  if (res.statusCode !== 200) {
    throw HTTPError(400, 'imgUrl returned a status that was not 200');
  }
  const photo = res.getBody();
  if (!fs.existsSync('./static')) {
    fs.mkdirSync('./static/photos', { recursive: true });
  }
  fs.writeFileSync('./static/photos/default.jpg', photo, { flag: 'w' });
}
export { getData, setData, loadData, uploadDefaultPhoto };
