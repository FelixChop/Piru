const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const request = require('supertest');
const app = require('../src/server');
const { _clearUsers } = require('../src/auth');
const { _clearWorks } = require('../src/works');

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

  it('rejects signup with non-French native language', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'nofr@example.com', password: 'secret', nativeLanguage: 'en', learningLanguages: [] });
    assert.strictEqual(res.status, 400);
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

describe('Works API', () => {
  beforeEach(() => {
    _clearWorks();
  });

  it('creates a work and returns extracted vocab', async () => {
    const res = await request(app)
      .post('/works')
      .send({ userId: 'user1', title: 'Book', author: 'Author', content: 'An extraordinary narrative with enigmatic characters.' });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.title, 'Book');
    assert.ok(res.body.vocab.length > 0);
  });

  it('lists works for a user', async () => {
    await request(app)
      .post('/works')
      .send({ userId: 'user42', title: 'Story', author: 'A', content: 'mysterious adventures occur here' });
    const res = await request(app)
      .get('/works')
      .query({ userId: 'user42' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].title, 'Story');
  });
});
