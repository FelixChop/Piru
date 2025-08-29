const crypto = require('crypto');

// In-memory store for users
const users = new Map();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Sign up a new user.
 * @param {string} email
 * @param {string} password
 * @param {string} nativeLanguage
 * @param {string[]} learningLanguages
 * @returns {{id:string,email:string,nativeLanguage:string,learningLanguages:string[]}}
 */
function signup(email, password, nativeLanguage, learningLanguages = []) {
  if (users.has(email)) {
    throw new Error('User already exists');
  }
  const id = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  const user = {
    id,
    email,
    passwordHash,
    nativeLanguage,
    learningLanguages: [...learningLanguages],
  };
  users.set(email, user);
  return { id, email, nativeLanguage, learningLanguages: [...learningLanguages] };
}

/**
 * Log in an existing user.
 * @param {string} email
 * @param {string} password
 * @returns {{id:string,email:string,nativeLanguage:string,learningLanguages:string[]}}
 */
function login(email, password) {
  const user = users.get(email);
  if (!user) {
    throw new Error('User not found');
  }
  const passwordHash = hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    throw new Error('Invalid credentials');
  }
  const { id, nativeLanguage, learningLanguages } = user;
  return { id, email, nativeLanguage, learningLanguages: [...learningLanguages] };
}

// Helper for tests to clear users
function _clearUsers() {
  users.clear();
}

module.exports = { signup, login, _clearUsers };
