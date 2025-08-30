const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const { signup, login, _clearUsers } = require('../src/auth');

describe('Authentication', () => {
  beforeEach(() => {
    _clearUsers();
  });

  it('signs up a new user and stores languages', () => {
    const user = signup('alice@example.com', 'secret', 'en', ['fr', 'es']);
    assert.strictEqual(user.email, 'alice@example.com');
    assert.strictEqual(user.nativeLanguage, 'en');
    assert.deepStrictEqual(user.learningLanguages, ['fr', 'es']);
  });

  it('prevents duplicate signups', () => {
    signup('bob@example.com', 'pass', 'fr', ['en']);
    assert.throws(() => signup('bob@example.com', 'pass', 'fr', ['en']));
  });

  it('rejects unsupported native languages', () => {
    assert.throws(() => signup('eve@example.com', 'pwd', 'jp', ['en']));
  });

  it('logs in an existing user', () => {
    signup('carol@example.com', 'pwd', 'fr', ['en']);
    const user = login('carol@example.com', 'pwd');
    assert.strictEqual(user.email, 'carol@example.com');
  });

  it('rejects invalid credentials', () => {
    signup('dave@example.com', 'pwd', 'fr', ['en']);
    assert.throws(() => login('dave@example.com', 'wrong'));
  });

  it('requires at least one learning language', () => {
    assert.throws(() => signup('eve@example.com', 'pwd', 'fr', []));
  });
});
