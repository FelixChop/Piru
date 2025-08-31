const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbFile = process.env.NODE_ENV === 'staging' ? 'piru-staging.sqlite' : 'piru.sqlite';
const dbPath = path.join(__dirname, '..', '..', dbFile);

const db = new sqlite3.Database(dbPath);

function init() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  return new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) return reject(err);
      db.all("PRAGMA table_info(users);", (err, rows) => {
        if (err) return reject(err);
        const hasIsAdmin = rows.some((row) => row.name === 'is_admin');
        if (!hasIsAdmin) {
          db.run(
            'ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0',
            (err) => {
              if (err) return reject(err);
              resolve();
            }
          );
        } else {
          resolve();
        }
      });
    });
  });
}

function clear() {
  return new Promise((resolve, reject) => {
    db.exec('DELETE FROM user_languages; DELETE FROM users;', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { db, init, clear, close };

