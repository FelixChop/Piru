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
    const signup = await request(app)
      .post('/auth/signup')
      .send({ email: 'delete@example.com', password: 'secret', nativeLanguage: 'en', learningLanguages: ['fr'] });
    const userId = signup.body.id;
    const delRes = await request(app)
      .delete('/auth/account')
      .query({ userId });
    assert.strictEqual(delRes.status, 204);
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'delete@example.com', password: 'secret' });
    assert.strictEqual(loginRes.status, 401);
  });

  it('returns 404 when deleting a non-existent account', async () => {
    const res = await request(app)
      .delete('/auth/account')
      .query({ userId: 'missing-user' });
    assert.strictEqual(res.status, 404);
  });
});

describe('Works API', () => {
  beforeEach(() => {
    _clearWorks();
    _clearVocab();
  });

  it('creates a work', async () => {
    const res = await request(app)
      .post('/works')
      .send({ userId: 'user1', title: 'Book', author: 'Author', content: 'An extraordinary narrative with enigmatic characters.', type: 'book' });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.title, 'Book');
    assert.strictEqual(res.body.type, 'book');
  });

  it('lists works for a user', async () => {
    await request(app)
      .post('/works')
      .send({ userId: 'user42', title: 'Story', author: 'A', content: 'mysterious adventures occur here', type: 'book' });
    const res = await request(app)
      .get('/works')
      .query({ userId: 'user42' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].title, 'Story');
  });

  it('deletes a work and its vocabulary', async () => {
    await request(app)
      .post('/works')
      .send({ userId: 'apiDel', title: 'T', author: 'A', content: 'alpha beta', type: 'book' });
    const list = await request(app)
      .get('/works')
      .query({ userId: 'apiDel' });
    const workId = list.body[0].id;
    let next = await request(app)
      .get('/vocab/next')
      .query({ userId: 'apiDel', workId });
    assert.strictEqual(next.status, 200);
    const delRes = await request(app)
      .delete(`/works/${workId}`)
      .query({ userId: 'apiDel' });
    assert.strictEqual(delRes.status, 204);
    next = await request(app)
      .get('/vocab/next')
      .query({ userId: 'apiDel', workId });
    assert.strictEqual(next.status, 204);
  });
});

describe('Vocabulary API', () => {
  beforeEach(() => {
    _clearVocab();
  });

  it('extracts vocabulary from text', async () => {
    const res = await request(app)
      .post('/vocab/extract')
      .send({ userId: 'u1', text: 'astonishing intricacies manifest' });
    assert.strictEqual(res.status, 201);
  });

  it('returns next word and updates after review', async () => {
    await request(app)
      .post('/vocab/extract')
      .send({ userId: 'u2', text: 'remarkable phenomena abound' });
    const next = await request(app)
      .get('/vocab/next')
      .query({ userId: 'u2' });
    assert.strictEqual(next.status, 200);
    const wordId = next.body.id;
    const review = await request(app)
      .post('/vocab/review')
      .send({ userId: 'u2', wordId, quality: 4 });
    assert.strictEqual(review.status, 200);
  });

  it('deletes a word', async () => {
    await request(app)
      .post('/vocab/extract')
      .send({ userId: 'u3', text: 'peculiar chronicles emerge' });
    const next = await request(app)
      .get('/vocab/next')
      .query({ userId: 'u3' });
    assert.strictEqual(next.status, 200);
    const wordId = next.body.id;
    const del = await request(app)
      .delete(`/vocab/${wordId}`)
      .query({ userId: 'u3' });
    assert.strictEqual(del.status, 204);
    const after = await request(app)
      .get('/vocab/next')
      .query({ userId: 'u3' });
    assert.strictEqual(after.status, 204);
  });

  it('removes a manually added word', async () => {
    const [word] = addWords('u4', [
      { word: 'transient', definition: 'temporary', citation: 'sample sentence' },
    ]);
    const del = await request(app)
      .delete(`/vocab/${word.id}`)
      .query({ userId: 'u4' });
    assert.strictEqual(del.status, 204);
    const next = await request(app)
      .get('/vocab/next')
      .query({ userId: 'u4' });
    assert.strictEqual(next.status, 204);
  });
});
