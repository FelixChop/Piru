const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const chatgpt = require('./chatgpt');
const { addWords } = require('./vocab');

// In-memory store for works and their vocabulary entries
const works = new Map(); // workId -> work object

// Lazy-loaded mapping from normalized movie title -> subtitle filename
let subtitleMap;

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/\(\d{4}\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const TITLE_ALIASES = new Map([
  [
    normalizeTitle("Harry Potter and the Sorcerer's Stone"),
    normalizeTitle("Harry Potter and the Philosopher's Stone"),
  ],
]);

function loadSubtitleMap() {
  if (subtitleMap) return subtitleMap;
  subtitleMap = new Map();
  try {
    const csvPath = path.join(
      __dirname,
      '..',
      'data',
      'subtitles',
      'mapping.csv'
    );
    const csv = fs.readFileSync(csvPath, 'utf8');
    const lines = csv.split(/\r?\n/).slice(1);
    for (const line of lines) {
      if (!line.trim()) continue;
      const match = line.match(/^"(.+)","(.+)"$/);
      if (match) {
        const filename = match[1];
        const movieTitle = normalizeTitle(match[2]);
        subtitleMap.set(movieTitle, filename);
      }
    }
    // propagate aliases
    for (const [alias, canonical] of TITLE_ALIASES) {
      const target = subtitleMap.get(canonical);
      if (target) subtitleMap.set(alias, target);
    }
  } catch (err) {
    // mapping file missing or unreadable; leave map empty
  }
  return subtitleMap;
}

function getSubtitleTextForTitle(title) {
  const map = loadSubtitleMap();
  let normalized = normalizeTitle(title);
  normalized = TITLE_ALIASES.get(normalized) || normalized;
  const filename = map.get(normalized);
  if (!filename) return null;
  const filePath = path.join(
    __dirname,
    '..',
    'data',
    'subtitles',
    'en',
    filename
  );
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
}

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
  let text = content;
  if (type === 'movie') {
    const subtitle = getSubtitleTextForTitle(title);
    if (subtitle) {
      text = subtitle;
    }
  }
  const vocab = await chatgpt.extractVocabularyWithLLM(text);
  const work = { id, userId, title, author, content, type, vocab };
  works.set(id, work);
  if (Array.isArray(vocab) && vocab.length) {
    addWords(userId, vocab);
  }
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

function listAllWorks() {
  return Array.from(works.values()).map(({ id, userId, title, author, vocab }) => ({
    id,
    userId,
    title,
    author,
    vocab,
  }));
}

function deleteWork(id) {
  return works.delete(id);
}

function _clearWorks() {
  works.clear();
}

module.exports = { addWork, listWorks, listAllWorks, deleteWork, _clearWorks };
