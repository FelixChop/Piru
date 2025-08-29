const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const request = require('supertest');
const app = require('../src/server');
const { _clearUsers } = require('../src/auth');

describe('Auth API', () => {
  beforeEach(() => {
    _clearUsers();
  });

  it('signs up a user', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'api@example.com', password: 'secret', nativeLanguage: 'fr', learningLanguages: ['en'] });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.id);
    assert.strictEqual(res.body.email, 'api@example.com');
    assert.strictEqual(res.body.nativeLanguage, 'fr');
    assert.deepStrictEqual(res.body.learningLanguages, ['en']);
  });

  it('prevents duplicate signup', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ email: 'dupe@example.com', password: 'secret', nativeLanguage: 'fr', learningLanguages: [] });
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'dupe@example.com', password: 'secret', nativeLanguage: 'fr', learningLanguages: [] });
    assert.strictEqual(res.status, 400);
  });

  it('logs in existing user', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ email: 'login@example.com', password: 'secret', nativeLanguage: 'fr', learningLanguages: [] });
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'login@example.com', password: 'secret' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.email, 'login@example.com');
  });

  it('rejects invalid login', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ email: 'badlogin@example.com', password: 'secret', nativeLanguage: 'fr', learningLanguages: [] });
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'badlogin@example.com', password: 'wrong' });
    assert.strictEqual(res.status, 401);
  });
});
