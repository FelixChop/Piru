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
