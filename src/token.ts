import { getData } from './dataStore';

/**
 *
 * @param {string} token
 * @returns {boolean} whether the token is already in the dataStore
 */
export function searchFortokens(token: string): boolean {
  const data = getData();
  let tokenInUse = false;
  for (const user of data.users) {
    for (const indivTok of user.tokens) {
      if (token === indivTok) {
        tokenInUse = true;
      }
    }
  }
  return tokenInUse;
}

/**
 *
 * @returns {string} a unique string
 */
export function createToken(): string {
  let token = '';
  const TOKEN_LENGTH = 6;
  for (let charInToken = 0; charInToken < TOKEN_LENGTH; charInToken++) {
    const newCharAscii = Math.floor(Math.random() * (126 - 33) + 33);
    token = token + String.fromCharCode(newCharAscii);
  }
  if (searchFortokens(token) === true) {
    token = createToken();
  }
  return token;
}
