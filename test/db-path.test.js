const { test } = require('node:test');
const assert = require('assert');
const path = require('path');

const authPath = path.resolve(__dirname, '../src/auth.js');
const dbPath = path.resolve(__dirname, '../src/db/index.js');

test('database persists across cwd changes', async () => {
  const { signup } = require(authPath);
  const { close } = require(dbPath);

  await signup('persist@example.com', 'secret', 'fr', ['en']);
  await close();

  const originalCwd = process.cwd();
  process.chdir(path.join(originalCwd, 'src'));
  delete require.cache[authPath];
  delete require.cache[dbPath];

  const { login, _clearUsers } = require(authPath);
  const user = await login('persist@example.com', 'secret');
  assert.strictEqual(user.email, 'persist@example.com');

  await _clearUsers();
  await require(dbPath).close();
  process.chdir(originalCwd);
});
