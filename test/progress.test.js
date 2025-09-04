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
    const agent = request.agent(app);
    await agent
      .post('/auth/signup')
      .send({
        email: 'prog@example.com',
        password: 'secret',
        nativeLanguage: 'en',
        learningLanguages: ['fr'],
      });
    await agent.post('/auth/login').send({
      email: 'prog@example.com',
      password: 'secret',
    });

    let res = await agent.get('/progress');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.progressMax, 10);
    assert.strictEqual(res.body.cookies, 0);

    res = await agent
      .post('/progress')
      .send({ progressMax: 11, cookies: 2 });
    assert.strictEqual(res.status, 204);

    res = await agent.get('/progress');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.progressMax, 11);
    assert.strictEqual(res.body.cookies, 2);
  });
});
