const { db } = require('./db');

function isAdmin(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(false);
      resolve(row.is_admin === 1);
    });
  });
}

function listUsers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, email, native_language, is_admin FROM users', (err, rows) => {
      if (err) return reject(err);
      const users = rows.map((r) => ({
        id: r.id,
        email: r.email,
        nativeLanguage: r.native_language,
        isAdmin: !!r.is_admin,
      }));
      resolve(users);
    });
  });
}

function deleteUser(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

module.exports = { isAdmin, listUsers, deleteUser };
