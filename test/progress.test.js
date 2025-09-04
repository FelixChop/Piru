const { describe, it, before, beforeEach } = require('node:test');
const assert = require('assert');
const request = require('supertest');

const { init } = require('../src/db');
const { _clearUsers } = require('../src/auth');
let app;

before(async () => {
  await init();
  app = require('../src/server');
});

beforeEach(async () => {
  await _clearUsers();
});

describe('Progress API', () => {
  it('retrieves and updates progress data', async () => {
    const signup = await request(app)
      .post('/auth/signup')
      .send({
        email: 'prog@example.com',
        password: 'secret',
        nativeLanguage: 'en',
        learningLanguages: ['fr'],
      });
    const userId = signup.body.id;

    let res = await request(app).get('/progress').query({ userId });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.progressMax, 10);
    assert.strictEqual(res.body.cookies, 0);

    res = await request(app)
      .post('/progress')
      .send({ userId, progressMax: 11, cookies: 2 });
    assert.strictEqual(res.status, 204);

    res = await request(app).get('/progress').query({ userId });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.progressMax, 11);
    assert.strictEqual(res.body.cookies, 2);
  });
});
