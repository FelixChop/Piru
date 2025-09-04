const { describe, it, before, after } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

process.env.NODE_ENV = 'staging';
const dbFile = path.join(__dirname, '..', 'piru-staging.sqlite');

describe('Database migration', () => {
  before(() => {
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
    return new Promise((resolve, reject) => {
      const tmpDb = new sqlite3.Database(dbFile);
      const oldSchema = `CREATE TABLE users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        native_language TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`;
      tmpDb.exec(oldSchema, (err) => {
        tmpDb.close((closeErr) => {
          if (err || closeErr) reject(err || closeErr);
          else resolve();
        });
      });
    });
  });

  it('adds is_admin column when missing', async () => {
    const { init, db, close } = require('../src/db');
    await init();
    const columns = await new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(users);', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    const hasIsAdmin = columns.some((col) => col.name === 'is_admin');
    const hasProgressMax = columns.some(
      (col) => col.name === 'flashcard_progress_max'
    );
    const hasCookie = columns.some((col) => col.name === 'cookie_count');
    assert.strictEqual(hasIsAdmin, true);
    assert.strictEqual(hasProgressMax, true);
    assert.strictEqual(hasCookie, true);
    await close();
  });

  after(() => {
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  });
});
