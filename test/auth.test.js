const { describe, it, before, beforeEach } = require('node:test');
const assert = require('assert');
const { signup, login, _clearUsers } = require('../src/auth');
const { init } = require('../src/db');

describe('Authentication', () => {
  before(async () => {
    await init();
  });
  beforeEach(async () => {
    await _clearUsers();
  });
  it('signs up a new user and stores languages', async () => {
    const user = await signup(
      'alice@example.com',
      'secret',
      'en',
      ['fr', 'es']
    );
    assert.strictEqual(user.email, 'alice@example.com');
    assert.strictEqual(user.nativeLanguage, 'en');
    assert.deepStrictEqual(user.learningLanguages, ['fr', 'es']);
  });

  it('prevents duplicate signups', async () => {
    await signup('bob@example.com', 'pass', 'fr', ['en']);
    await assert.rejects(() => signup('bob@example.com', 'pass', 'fr', ['en']));
  });

  it('rejects unsupported native languages', () => {
    assert.throws(() => signup('eve@example.com', 'pwd', 'jp', ['en']));
  });

  it('logs in an existing user', async () => {
    await signup('carol@example.com', 'pwd', 'fr', ['en']);
    const user = await login('carol@example.com', 'pwd');
    assert.strictEqual(user.email, 'carol@example.com');
  });

  it('rejects invalid credentials', async () => {
    await signup('dave@example.com', 'pwd', 'fr', ['en']);
    await assert.rejects(() => login('dave@example.com', 'wrong'));
  });

  it('requires at least one learning language', async () => {
    await assert.rejects(() => signup('eve@example.com', 'pwd', 'fr', []));
  });
});
