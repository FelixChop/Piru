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

before(async () => {
  await init();
  app = require('../src/server');
});
const { _clearWorks } = require('../src/works');
const { _clear: _clearVocab, addWords } = require('../src/vocab');

async function signupAndLogin(email, options = {}) {
  const agent = request.agent(app);
  const password = options.password || 'secret';
  const signupRes = await agent.post('/auth/signup').send({
    email,
    password,
    nativeLanguage: 'en',
    learningLanguages: ['fr'],
    ...options,
  });
  await agent.post('/auth/login').send({ email, password });
  return { agent, userId: signupRes.body.id, password };
}

describe('Auth API', () => {
  beforeEach(async () => {
    await _clearUsers();
  });

  it('signs up a user', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'api@example.com', password: 'secret', nativeLanguage: 'en', learningLanguages: ['fr'] });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.id);
    assert.strictEqual(res.body.email, 'api@example.com');
    assert.strictEqual(res.body.nativeLanguage, 'en');
    assert.deepStrictEqual(res.body.learningLanguages, ['fr']);
  });

  it('rejects signup with unsupported native language', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'nofr@example.com', password: 'secret', nativeLanguage: 'jp', learningLanguages: ['en'] });
    assert.strictEqual(res.status, 400);
  });

  it('prevents duplicate signup', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ email: 'dupe@example.com', password: 'secret', nativeLanguage: 'fr', learningLanguages: ['en'] });
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'dupe@example.com', password: 'secret', nativeLanguage: 'fr', learningLanguages: ['en'] });
    assert.strictEqual(res.status, 400);
  });

  it('logs in existing user', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ email: 'login@example.com', password: 'secret', nativeLanguage: 'fr', learningLanguages: ['en'] });
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'login@example.com', password: 'secret' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.email, 'login@example.com');
  });

  it('rejects invalid login', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ email: 'badlogin@example.com', password: 'secret', nativeLanguage: 'fr', learningLanguages: ['en'] });
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'badlogin@example.com', password: 'wrong' });
    assert.strictEqual(res.status, 401);
  });
  
  it('requires at least one learning language', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'nolanguage@example.com', password: 'secret', nativeLanguage: 'fr', learningLanguages: [] });
    assert.strictEqual(res.status, 400);
  });

  it('deletes an account', async () => {
    const { agent } = await signupAndLogin('delete@example.com');
    const delRes = await agent.delete('/auth/account');
    assert.strictEqual(delRes.status, 204);
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'delete@example.com', password: 'secret' });
    assert.strictEqual(loginRes.status, 401);
  });

  it('returns 401 when deleting a non-existent account', async () => {
    const res = await request(app).delete('/auth/account');
    assert.strictEqual(res.status, 401);
  });
});

describe('Works API', () => {
  beforeEach(() => {
    _clearWorks();
    _clearVocab();
  });

  it('creates a work', async () => {
    const { agent } = await signupAndLogin('user1@example.com');
    const res = await agent
      .post('/works')
      .send({ title: 'Book', author: 'Author', content: 'An extraordinary narrative with enigmatic characters.', type: 'book' });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.title, 'Book');
    assert.strictEqual(res.body.type, 'book');
  });

  it('lists works for a user', async () => {
    const { agent } = await signupAndLogin('user42@example.com');
    await agent
      .post('/works')
      .send({ title: 'Story', author: 'A', content: 'mysterious adventures occur here', type: 'book' });
    const res = await agent.get('/works');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].title, 'Story');
  });

  it('deletes a work and its vocabulary', async () => {
    const { agent } = await signupAndLogin('apid@example.com');
    await agent
      .post('/works')
      .send({ title: 'T', author: 'A', content: 'alpha beta', type: 'book' });
    const list = await agent.get('/works');
    const workId = list.body[0].id;
    let next = await agent.get('/vocab/next').query({ workId });
    assert.strictEqual(next.status, 200);
    const delRes = await agent.delete(`/works/${workId}`);
    assert.strictEqual(delRes.status, 204);
    next = await agent.get('/vocab/next').query({ workId });
    assert.strictEqual(next.status, 204);
  });
});

describe('Vocabulary API', () => {
  beforeEach(() => {
    _clearVocab();
  });

  it('extracts vocabulary from text', async () => {
    const { agent } = await signupAndLogin('u1@example.com');
    const res = await agent
      .post('/vocab/extract')
      .send({ text: 'astonishing intricacies manifest' });
    assert.strictEqual(res.status, 201);
  });

  it('returns next word and updates after review', async () => {
    const { agent } = await signupAndLogin('u2@example.com');
    await agent
      .post('/vocab/extract')
      .send({ text: 'remarkable phenomena abound' });
    const next = await agent.get('/vocab/next');
    assert.strictEqual(next.status, 200);
    const wordId = next.body.id;
    const review = await agent
      .post('/vocab/review')
      .send({ wordId, quality: 4 });
    assert.strictEqual(review.status, 200);
  });

  it('deletes a word', async () => {
    const { agent } = await signupAndLogin('u3@example.com');
    await agent
      .post('/vocab/extract')
      .send({ text: 'peculiar chronicles emerge' });
    const next = await agent.get('/vocab/next');
    assert.strictEqual(next.status, 200);
    const wordId = next.body.id;
    const del = await agent.delete(`/vocab/${wordId}`);
    assert.strictEqual(del.status, 204);
    const after = await agent.get('/vocab/next');
    assert.strictEqual(after.status, 204);
  });

  it('removes a manually added word', async () => {
    const { agent, userId } = await signupAndLogin('u4@example.com');
    const [word] = addWords(userId, [
      { word: 'transient', definition: 'temporary', citation: 'sample sentence' },
    ]);
    const del = await agent.delete(`/vocab/${word.id}`);
    assert.strictEqual(del.status, 204);
    const next = await agent.get('/vocab/next');
    assert.strictEqual(next.status, 204);
  });

  it('returns random words', async () => {
    const { agent, userId } = await signupAndLogin('u5@example.com');
    addWords(userId, [
      { word: 'alpha', definition: 'first', citation: '' },
      { word: 'beta', definition: 'second', citation: '' },
      { word: 'gamma', definition: 'third', citation: '' },
      { word: 'delta', definition: 'fourth', citation: '' },
    ]);
    const res = await agent.get('/vocab/random').query({ count: 3 });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 3);
  });
});
