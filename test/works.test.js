const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const { addWork, listWorks, _clearWorks } = require('../src/works');

describe('Works management', () => {
  beforeEach(() => {
    _clearWorks();
  });

  it('adds a work and extracts difficult words', () => {
    const content = 'This passage contains formidable terminology and simple words.';
    const work = addWork('user1', 'Sample', 'Author', content);
    assert.strictEqual(work.title, 'Sample');
    assert.ok(work.vocab.find((v) => v.word === 'formidable'));
  });

  it('lists works for a specific user', () => {
    addWork('user1', 'Work1', 'A', 'extraordinary concepts abound');
    addWork('user2', 'Work2', 'B', 'irrelevant context');
    const works = listWorks('user1');
    assert.strictEqual(works.length, 1);
    assert.strictEqual(works[0].title, 'Work1');
  });
});
