const fs = require('fs');
const path = require('path');

const dbFile = process.env.NODE_ENV === 'staging' ? 'piru-staging.sqlite' : 'piru.sqlite';
// Use the current working directory for the SQLite database so that the
// initialization script works even when the project files are installed in a
// read-only location (for example when Piru is installed globally).
const dbPath = path.join(process.cwd(), dbFile);

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
