const crypto = require('crypto');

const { db, clear } = require('./db');

// Supported native languages
const SUPPORTED_LANGUAGES = new Set(['en', 'fr', 'it', 'es', 'de']);

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
  if (!Array.isArray(learningLanguages) || learningLanguages.length === 0) {
    return Promise.reject(new Error('At least one learning language is required'));
  }
  if (!SUPPORTED_LANGUAGES.has(nativeLanguage)) {
    throw new Error('Native language not available');
  }
  const id = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        'INSERT INTO users (id, email, password_hash, native_language) VALUES (?,?,?,?)',
        [id, email, passwordHash, nativeLanguage],
        (err) => {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              return reject(new Error('User already exists'));
            }
            return reject(err);
          }
          const stmt = db.prepare(
            'INSERT INTO user_languages (user_id, language_code) VALUES (?, ?)'
          );
          for (const lang of learningLanguages) {
            stmt.run(id, lang);
          }
          stmt.finalize((err2) => {
            if (err2) return reject(err2);
            resolve({ id, email, nativeLanguage, learningLanguages: [...learningLanguages] });
          });
        }
      );
    });
  });
}

/**
 * Log in an existing user.
 * @param {string} email
 * @param {string} password
 * @returns {{id:string,email:string,nativeLanguage:string,learningLanguages:string[]}}
 */
function login(email, password) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('User not found'));
      const passwordHash = hashPassword(password);
      if (row.password_hash !== passwordHash) {
        return reject(new Error('Invalid credentials'));
      }
      db.all(
        'SELECT language_code FROM user_languages WHERE user_id = ?',
        [row.id],
        (err2, rows) => {
          if (err2) return reject(err2);
          const learningLanguages = rows.map((r) => r.language_code);
          resolve({
            id: row.id,
            email: row.email,
            nativeLanguage: row.native_language,
            learningLanguages,
          });
        }
      );
    });
  });
}

// Helper for tests to clear users
function _clearUsers() {
  return clear();
}

module.exports = { signup, login, _clearUsers };
