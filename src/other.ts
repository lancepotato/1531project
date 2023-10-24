import { setData } from './dataStore';
import { dataStore } from './interface';

/**
* Resets the internal data of the application to its initial state.
* @returns {}
*/
function clearV1() {
  const data: dataStore = {
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

  setData(data);
  return {};
}

export { clearV1 };
