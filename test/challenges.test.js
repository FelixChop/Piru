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

describe('Challenges API', () => {
  beforeEach(() => {
    _clearWorks();
    _clearVocab();
    _clearChallenges();
  });

  it('creates a challenge and determines winner', async () => {
    await request(app)
      .post('/works')
      .send({ userId: 'u1', title: 'W', author: 'A', content: 'text', type: 'book' });
    const list = await request(app).get('/works').query({ userId: 'u1' });
    const workId = list.body[0].id;
    const createRes = await request(app)
      .post('/challenges')
      .send({ userId: 'u1', workId });
    assert.strictEqual(createRes.status, 201);
    const challengeId = createRes.body.id;
    assert.ok(challengeId);

    let res = await request(app)
      .post(`/challenges/${challengeId}/score`)
      .send({ userId: 'u1', score: 3 });
    assert.strictEqual(res.status, 200);

    res = await request(app)
      .post(`/challenges/${challengeId}/score`)
      .send({ userId: 'u2', score: 5 });
    assert.strictEqual(res.status, 200);

    const final = await request(app).get(`/challenges/${challengeId}`);
    assert.strictEqual(final.status, 200);
    assert.strictEqual(final.body.winner, 'u2');
  });
});
