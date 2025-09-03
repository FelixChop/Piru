const { sm2 } = require('./sm2');
const crypto = require('crypto');

// In-memory vocabulary store: userId -> Map(wordId -> word data)
const vocab = new Map();

function addWords(userId, words) {
  if (!vocab.has(userId)) {
    vocab.set(userId, new Map());
  }
  const store = vocab.get(userId);
  const added = [];
  const now = Date.now();
  words.forEach((w) => {
    const entry = {
      ...w,
      id: w.id || crypto.randomUUID(),
      interval: 0,
      repetitions: 0,
      easiness: 2.5,
      due: now,
    };
    store.set(entry.id, entry);
    added.push(entry);
  });
  return added;
}

function getNextWord(userId, workId) {
  const store = vocab.get(userId);
  if (!store) return null;
  const now = Date.now();
  const dueWords = Array.from(store.values()).filter(
    (w) => w.due <= now && (!workId || w.workId === workId)
  );
  if (dueWords.length === 0) return null;
  dueWords.sort((a, b) => a.due - b.due);
  return dueWords[0];
}

function reviewWord(userId, wordId, quality) {
  const store = vocab.get(userId);
  if (!store) throw new Error('User not found');
  const word = store.get(wordId);
  if (!word) throw new Error('Word not found');
  const { interval, repetitions, easiness } = sm2({
    interval: word.interval,
    repetitions: word.repetitions,
    easiness: word.easiness,
  }, quality);
  word.interval = interval;
  word.repetitions = repetitions;
  word.easiness = easiness;
  word.due = Date.now() + interval * 24 * 60 * 60 * 1000;
  return word;
}

function deleteWord(userId, wordId) {
  const store = vocab.get(userId);
  if (!store) return false;
  return store.delete(wordId);
}

function deleteWorkVocab(userId, workId) {
  const store = vocab.get(userId);
  if (!store) return;
  for (const [id, word] of store.entries()) {
    if (word.workId === workId) {
      store.delete(id);
    }
  }
}

function deleteUserVocab(userId) {
  vocab.delete(userId);
}

function _clear() {
  vocab.clear();
}

function getWorkStats(userId, workId) {
  const store = vocab.get(userId);
  if (!store) return { total: 0, learned: 0 };
  let total = 0;
  let learned = 0;
  for (const word of store.values()) {
    if (word.workId === workId) {
      total++;
      if (word.repetitions > 0) learned++;
    }
  }
  return { total, learned };
}

module.exports = {
  addWords,
  getNextWord,
  reviewWord,
  deleteWord,
  deleteWorkVocab,
  deleteUserVocab,
  _clear,
  getWorkStats,
};
