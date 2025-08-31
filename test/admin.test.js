const { describe, it, before, beforeEach } = require('node:test');
const assert = require('assert');
const request = require('supertest');

process.env.OPENAI_API_KEY = 'test';
global.fetch = async () => ({
  json: async () => ({
    choices: [
      {
        message: {
          content: JSON.stringify([
            { word: 'mockword', definition: 'mock definition', citation: 'mock citation' },
          ]),
        },
      },
    ],
  }),
});

const { init } = require('../src/db');
let app;
const { _clearUsers } = require('../src/auth');
const { _clearWorks } = require('../src/works');

describe('Admin API', () => {
  before(async () => {
    await init();
    app = require('../src/server');
  });

  beforeEach(async () => {
    await _clearUsers();
    _clearWorks();
  });

  it('allows admin to list users', async () => {
    const adminRes = await request(app)
      .post('/auth/signup')
      .send({ email: 'admin@example.com', password: 'pass', nativeLanguage: 'en', learningLanguages: ['fr'], isAdmin: true });
    const adminId = adminRes.body.id;
    await request(app)
      .post('/auth/signup')
      .send({ email: 'user@example.com', password: 'pass', nativeLanguage: 'fr', learningLanguages: ['en'] });
    const res = await request(app)
      .get('/admin/users')
      .query({ userId: adminId });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.length >= 2);
  });

  it('prevents non-admin from accessing user list', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ email: 'admin2@example.com', password: 'pass', nativeLanguage: 'en', learningLanguages: ['fr'], isAdmin: true });
    const userRes = await request(app)
      .post('/auth/signup')
      .send({ email: 'user2@example.com', password: 'pass', nativeLanguage: 'fr', learningLanguages: ['en'] });
    const res = await request(app)
      .get('/admin/users')
      .query({ userId: userRes.body.id });
    assert.strictEqual(res.status, 403);
  });

  it('lists works for admin', async () => {
    const adminRes = await request(app)
      .post('/auth/signup')
      .send({ email: 'admin3@example.com', password: 'pass', nativeLanguage: 'en', learningLanguages: ['fr'], isAdmin: true });
    const adminId = adminRes.body.id;
    await request(app)
      .post('/works')
      .send({ userId: 'u1', title: 'Book', author: 'A', content: 'An extraordinary narrative.', type: 'book' });
    const res = await request(app)
      .get('/admin/works')
      .query({ userId: adminId });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
  });
});
