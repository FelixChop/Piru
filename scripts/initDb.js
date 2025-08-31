const fs = require('fs');
const path = require('path');

const dbFile = process.env.NODE_ENV === 'staging' ? 'piru-staging.sqlite' : 'piru.sqlite';
const dbPath = path.join(__dirname, '..', dbFile);

if (process.env.NODE_ENV === 'test' && fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const { init, close } = require('../src/db');

init()
  .then(() => {
    console.log('Database tables ensured.');
    return close();
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
