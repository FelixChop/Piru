const crypto = require('crypto');

// In-memory store for works and their vocabulary entries
const works = new Map(); // workId -> work object

function extractVocabulary(content) {
  const tokens = (content.toLowerCase().match(/\b\w+\b/g) || []);
  const unique = Array.from(new Set(tokens));
  // Naive difficulty heuristic: words longer than 6 letters
  const difficult = unique.filter((w) => w.length > 6);
  return difficult.map((word) => ({
    id: crypto.randomUUID(),
    word,
    definition: `Definition of ${word}`,
    citations: [findCitation(content, word)],
    status: 'new',
  }));
}

function findCitation(content, word) {
  const idx = content.toLowerCase().indexOf(word.toLowerCase());
  if (idx === -1) return '';
  const start = Math.max(0, idx - 20);
  const end = Math.min(content.length, idx + word.length + 20);
  return content.slice(start, end).trim();
}

/**
 * Add a work for a user and extract vocabulary
 * @param {string} userId
 * @param {string} title
 * @param {string} author
 * @param {string} content
 * @returns {{id:string,title:string,author:string,vocab:Object[]}}
 */
function addWork(userId, title, author, content) {
  const id = crypto.randomUUID();
  const vocab = extractVocabulary(content);
  const work = { id, userId, title, author, content, vocab };
  works.set(id, work);
  return { id, title, author, vocab };
}

/**
 * List works for a given user
 * @param {string} userId
 * @returns {Array<{id:string,title:string,author:string,vocab:Object[]}>}
 */
function listWorks(userId) {
  return Array.from(works.values())
    .filter((w) => w.userId === userId)
    .map(({ id, title, author, vocab }) => ({ id, title, author, vocab }));
}

function _clearWorks() {
  works.clear();
}

module.exports = { addWork, listWorks, _clearWorks, extractVocabulary };
