const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbFile = process.env.NODE_ENV === 'staging' ? 'piru-staging.sqlite' : 'piru.sqlite';
// Store the SQLite database in a predictable location so that data persists
// regardless of where the server is started from. The directory can be
// overridden with the `PIRU_DB_DIR` environment variable. By default we use
// the project root.
const dbDir = process.env.PIRU_DB_DIR || path.resolve(__dirname, '..', '..');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, dbFile);

const db = new sqlite3.Database(dbPath);

function init() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  return new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) return reject(err);
      db.all("PRAGMA table_info(users);", (err, rows) => {
        if (err) return reject(err);
        const queries = [];
        if (!rows.some((row) => row.name === 'is_admin')) {
          queries.push('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0');
        }
        if (!rows.some((row) => row.name === 'flashcard_progress_max')) {
          queries.push(
            'ALTER TABLE users ADD COLUMN flashcard_progress_max INTEGER DEFAULT 10'
          );
        }
        if (!rows.some((row) => row.name === 'cookie_count')) {
          queries.push(
            'ALTER TABLE users ADD COLUMN cookie_count INTEGER DEFAULT 0'
          );
        }
        if (queries.length === 0) return resolve();
        db.serialize(() => {
          const runNext = (idx) => {
            if (idx >= queries.length) return resolve();
            db.run(queries[idx], (err) => {
              if (err) return reject(err);
              runNext(idx + 1);
            });
          };
          runNext(0);
        });
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

