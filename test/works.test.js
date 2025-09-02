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
const { getNextWord, _clear: _clearVocab } = require('../src/vocab');

describe('Works management', () => {
  beforeEach(() => {
    _clearWorks();
    _clearVocab();
  });

  it('adds a work', async () => {
    const content =
      'This passage contains formidable terminology and simple words.';
    const work = await addWork('user1', 'Sample', 'Author', content, 'book');
    assert.strictEqual(work.title, 'Sample');
    assert.ok(work.pages);
    assert.strictEqual(work.pages.length, 1);
  });

  it('lists works for a specific user', async () => {
    await addWork('user1', 'Work1', 'A', 'extraordinary concepts abound', 'book');
    await addWork('user2', 'Work2', 'B', 'irrelevant context', 'book');
    const works = listWorks('user1');
    assert.strictEqual(works.length, 1);
    assert.strictEqual(works[0].title, 'Work1');
  });

  it('extracts vocab from subtitles when adding a movie', async () => {
    chatgpt.extractVocabularyWithLLM = async (chunk) => {
      if (chunk.includes('Hedwig')) {
        return [
          { id: crypto.randomUUID(), word: 'hedwig', definition: '', citation: '' },
        ];
      }
      return [];
    };
    await addWork(
      'movieUser',
      'Harry Potter and the Chamber of Secrets',
      '',
      '',
      'movie'
    );
    const next = getNextWord('movieUser');
    assert.ok(next);
    assert.strictEqual(next.word, 'hedwig');
  });

  it("handles 'Harry Potter and the Philosopher's Stone' for subtitle lookup", async () => {
    chatgpt.extractVocabularyWithLLM = async (chunk) => {
      if (chunk.includes('McGonagall')) {
        return [
          { id: crypto.randomUUID(), word: 'mcgonagall', definition: '', citation: '' },
        ];
      }
      return [];
    };
    await addWork(
      'altUser',
      "Harry Potter and the Philosopher's Stone (2001)",
      '',
      '',
      'movie'
    );
    const next = getNextWord('altUser');
    assert.ok(next);
    assert.strictEqual(next.word, 'mcgonagall');
  });

  it('extracts vocab from local epub when adding a book', async () => {
    chatgpt.extractVocabularyWithLLM = async (chunk) => {
      if (chunk.includes('Breedlove')) {
        return [
          {
            id: crypto.randomUUID(),
            word: 'breedlove',
            definition: '',
            citations: [],
            status: 'new',
          },
        ];
      }
      return [];
    };
    const work = await addWork(
      'bookUser',
      'The Bluest Eye',
      'Morrison, Toni',
      '',
      'book'
    );
    const found = work.pages.some((p) =>
      p.vocab.some((v) => v.word === 'breedlove')
    );
    assert.ok(found);
    const next = getNextWord('bookUser');
    assert.ok(next);
    assert.strictEqual(next.word, 'breedlove');
  });

  it('filters vocabulary by work id', async () => {
    chatgpt.extractVocabularyWithLLM = async (content) => {
      const tokens = content.toLowerCase().match(/\b\w+\b/g) || [];
      const unique = Array.from(new Set(tokens));
      return unique.map((word) => ({
        id: crypto.randomUUID(),
        word,
        definition: '',
        citations: [],
        status: 'new',
      }));
    };
    const w1 = await addWork('fUser', 'First', '', 'alpha beta', 'book');
    const w2 = await addWork('fUser', 'Second', '', 'gamma delta', 'book');
    const next1 = getNextWord('fUser', w1.id);
    const next2 = getNextWord('fUser', w2.id);
    assert.notStrictEqual(next1.id, next2.id);
    assert.ok(['alpha', 'beta'].includes(next1.word));
    assert.ok(['gamma', 'delta'].includes(next2.word));
  });
});
