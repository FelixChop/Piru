const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const request = require('supertest');
const app = require('../src/server');
const { addWork, _clearWorks } = require('../src/works');
const { getOverview } = require('../src/stats');

describe('Stats overview', () => {
  beforeEach(() => {
    _clearWorks();
  });

  it('computes totals for a user', () => {
    const content = 'extraordinary narratives with enigmatic characters appear';
    addWork('user1', 'Sample', 'Author', content);
    const stats = getOverview('user1');
    assert.strictEqual(stats.totalWords, 4);
    assert.strictEqual(stats.masteredWords, 0);
  });

  it('serves overview via API', async () => {
    const userId = 'apiUser';
    const content = 'magnificent creatures roam';
    await request(app)
      .post('/works')
      .send({ userId, title: 'T', author: 'A', content });
    const res = await request(app)
      .get('/stats/overview')
      .query({ userId });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.totalWords, 2);
    assert.strictEqual(res.body.masteredWords, 0);
  });
});
