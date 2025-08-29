const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to SQLite database file
const dbPath = path.join(__dirname, '..', 'piru.sqlite');
// Path to schema SQL file
const schemaPath = path.join(__dirname, '..', 'src', 'db', 'schema.sql');

const schema = fs.readFileSync(schemaPath, 'utf8');

const db = new sqlite3.Database(dbPath);

db.exec(schema, (err) => {
  if (err) {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  }
  console.log('Database tables ensured.');
  db.close();
});
