const crypto = require('crypto');
const chatgpt = require('./chatgpt');

// In-memory store for works and their vocabulary entries
const works = new Map(); // workId -> work object

/**
 * Add a work for a user and extract vocabulary
 * @param {string} userId
 * @param {string} title
 * @param {string} author
 * @param {string} content
 * @returns {{id:string,title:string,author:string,vocab:Object[]}}
 */
async function addWork(userId, title, author, content, type) {
  const id = crypto.randomUUID();
  const vocab = await chatgpt.extractVocabularyWithLLM(content);
  const work = { id, userId, title, author, content, type, vocab };
  works.set(id, work);
  return { id, title, author, type, vocab };
}

/**
 * List works for a given user
 * @param {string} userId
 * @returns {Array<{id:string,title:string,author:string,vocab:Object[]}>}
 */
function listWorks(userId) {
  return Array.from(works.values())
    .filter((w) => w.userId === userId)
    .map(({ id, title, author, type, vocab }) => ({ id, title, author, type, vocab }));
}

function _clearWorks() {
  works.clear();
}

module.exports = { addWork, listWorks, _clearWorks };
