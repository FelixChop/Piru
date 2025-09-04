const { describe, it, before, beforeEach } = require('node:test');
const assert = require('assert');
const request = require('supertest');

const { init } = require('../src/db');
let app;
const { _clearWorks } = require('../src/works');
const { _clear: _clearVocab } = require('../src/vocab');
const { _clear: _clearChallenges } = require('../src/challenges');

process.env.OPENAI_API_KEY = 'test';
global.fetch = async () => ({
  json: async () => ({
    choices: [
      { message: { content: JSON.stringify([{ word: 'mockword', definition: 'mock', citation: 'mock' }]) } },
    ],
  }),
});

before(async () => {
  await init();
  app = require('../src/server');
});

async function signupAndLogin(email) {
  const agent = request.agent(app);
  const password = 'secret';
  const signupRes = await agent.post('/auth/signup').send({
    email,
    password,
    nativeLanguage: 'en',
    learningLanguages: ['fr'],
  });
  await agent.post('/auth/login').send({ email, password });
  return { agent, userId: signupRes.body.id };
}

describe('Challenges API', () => {
  beforeEach(() => {
    _clearWorks();
    _clearVocab();
    _clearChallenges();
  });

  it('creates a challenge and determines winner', async () => {
    const { agent: agent1, userId: user1Id } = await signupAndLogin('u1@example.com');
    const { agent: agent2, userId: user2Id } = await signupAndLogin('u2@example.com');
    await agent1
      .post('/works')
      .send({ title: 'W', author: 'A', content: 'text', type: 'book' });
    const list = await agent1.get('/works');
    const workId = list.body[0].id;
    const createRes = await agent1
      .post('/challenges')
      .send({ workId });
    assert.strictEqual(createRes.status, 201);
    const challengeId = createRes.body.id;
    assert.ok(challengeId);

    let res = await agent1
      .post(`/challenges/${challengeId}/score`)
      .send({ score: 3 });
    assert.strictEqual(res.status, 200);

    res = await agent2
      .post(`/challenges/${challengeId}/score`)
      .send({ score: 5 });
    assert.strictEqual(res.status, 200);

    const final = await request(app).get(`/challenges/${challengeId}`);
    assert.strictEqual(final.status, 200);
    assert.strictEqual(final.body.winner, user2Id);
  });
});
