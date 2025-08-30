const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const { signup, login, _clearUsers } = require('../src/auth');

describe('Authentication', () => {
  beforeEach(() => {
    _clearUsers();
  });

  it('signs up a new user and stores languages', () => {
    const user = signup('alice@example.com', 'secret', 'fr', ['en', 'es']);
    assert.strictEqual(user.email, 'alice@example.com');
    assert.strictEqual(user.nativeLanguage, 'fr');
    assert.deepStrictEqual(user.learningLanguages, ['en', 'es']);
  });

  it('prevents duplicate signups', () => {
    signup('bob@example.com', 'pass', 'fr', []);
    assert.throws(() => signup('bob@example.com', 'pass', 'fr', []));
  });

  it('rejects non-French native languages', () => {
    assert.throws(() => signup('eve@example.com', 'pwd', 'en', []));
  });

  it('logs in an existing user', () => {
    signup('carol@example.com', 'pwd', 'fr', ['en']);
    const user = login('carol@example.com', 'pwd');
    assert.strictEqual(user.email, 'carol@example.com');
  });

  it('rejects invalid credentials', () => {
    signup('dave@example.com', 'pwd', 'fr', []);
    assert.throws(() => login('dave@example.com', 'wrong'));
  });
});
