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

async function signupAndLogin(email, options = {}) {
  const agent = request.agent(app);
  const password = options.password || 'pass';
  const signupRes = await agent.post('/auth/signup').send({
    email,
    password,
    nativeLanguage: 'en',
    learningLanguages: ['fr'],
    ...options,
  });
  await agent.post('/auth/login').send({ email, password });
  return { agent, userId: signupRes.body.id };
}

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
    const { agent: adminAgent } = await signupAndLogin('admin@example.com', { isAdmin: true });
    await signupAndLogin('user@example.com');
    const res = await adminAgent.get('/admin/users');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.length >= 2);
  });

  it('prevents non-admin from accessing user list', async () => {
    await signupAndLogin('admin2@example.com', { isAdmin: true });
    const { agent: userAgent } = await signupAndLogin('user2@example.com');
    const res = await userAgent.get('/admin/users');
    assert.strictEqual(res.status, 403);
  });

  it('lists works for admin', async () => {
    const { agent: adminAgent } = await signupAndLogin('admin3@example.com', { isAdmin: true });
    const { agent: userAgent } = await signupAndLogin('u1@example.com');
    await userAgent
      .post('/works')
      .send({ title: 'Book', author: 'A', content: 'An extraordinary narrative.', type: 'book' });
    const res = await adminAgent.get('/admin/works');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
  });
});
