const { db } = require('./db');

function getProgress(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT flashcard_progress_max AS progressMax, cookie_count AS cookies FROM users WHERE id = ?',
      [userId],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve({ progressMax: row.progressMax, cookies: row.cookies });
      }
    );
  });
}

function updateProgress(userId, progressMax, cookies) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET flashcard_progress_max = ?, cookie_count = ? WHERE id = ?',
      [progressMax, cookies, userId],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

module.exports = { getProgress, updateProgress };
