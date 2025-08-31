const { describe, it, beforeEach } = require('node:test');
const assert = require('assert');
const crypto = require('crypto');
const chatgpt = require('../src/chatgpt');

chatgpt.extractVocabularyWithLLM = async (content) => {
  const tokens = (content.toLowerCase().match(/\b\w+\b/g) || []);
  const unique = Array.from(new Set(tokens));
  return unique.map((word) => ({
    id: crypto.randomUUID(),
    word,
    definition: '',
    citations: [],
    status: 'new',
  }));
};

const { addWork, listWorks, _clearWorks } = require('../src/works');

describe('Works management', () => {
  beforeEach(() => {
    _clearWorks();
  });

  it('adds a work', async () => {
    const content =
      'This passage contains formidable terminology and simple words.';
    const work = await addWork('user1', 'Sample', 'Author', content);
    assert.strictEqual(work.title, 'Sample');
  });

  it('lists works for a specific user', async () => {
    await addWork('user1', 'Work1', 'A', 'extraordinary concepts abound');
    await addWork('user2', 'Work2', 'B', 'irrelevant context');
    const works = listWorks('user1');
    assert.strictEqual(works.length, 1);
    assert.strictEqual(works[0].title, 'Work1');
  });
});
