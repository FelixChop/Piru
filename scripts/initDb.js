const fs = require('fs');
const path = require('path');

const dbFile = process.env.NODE_ENV === 'staging' ? 'piru-staging.sqlite' : 'piru.sqlite';
// Use the same location strategy as the main application so that the
// initialization script operates on the correct database regardless of where
// it is executed from. The directory can be overridden with `PIRU_DB_DIR`.
const dbDir = process.env.PIRU_DB_DIR || path.resolve(__dirname, '..');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, dbFile);

if (process.env.NODE_ENV === 'test' && fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const { init, close } = require('../src/db');

init()
  .then(() => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('Database tables ensured.');
    }
    return close();
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
