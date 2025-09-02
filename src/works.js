const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const chatgpt = require('./chatgpt');
const { addWords } = require('./vocab');

// In-memory store for works and their vocabulary entries
const works = new Map(); // workId -> work object

// Lazy-loaded mapping from normalized movie title -> subtitle filename
let subtitleMap;
// Lazy-loaded mapping from normalized movie title -> thumbnail filename
let thumbnailMap;

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

function loadMaps() {
  if (subtitleMap && thumbnailMap) return;
  subtitleMap = new Map();
  thumbnailMap = new Map();
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
      const parts = line.split(/","/).map((s) => s.replace(/^"|"$/g, ''));
      const subtitle = parts[0];
      const movieTitle = normalizeTitle(parts[1]);
      subtitleMap.set(movieTitle, subtitle);
      const thumb = parts[2];
      if (thumb) thumbnailMap.set(movieTitle, thumb);
    }
    for (const [alias, canonical] of TITLE_ALIASES) {
      const sub = subtitleMap.get(canonical);
      if (sub) subtitleMap.set(alias, sub);
      const thumb = thumbnailMap.get(canonical);
      if (thumb) thumbnailMap.set(alias, thumb);
    }
  } catch (err) {
    // mapping file missing or unreadable
  }
}

function loadSubtitleMap() {
  loadMaps();
  return subtitleMap;
}

function loadThumbnailMap() {
  loadMaps();
  return thumbnailMap;
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

function getThumbnailForTitle(title) {
  const subtitles = loadSubtitleMap();
  const thumbs = loadThumbnailMap();
  let normalized = normalizeTitle(title);
  normalized = TITLE_ALIASES.get(normalized) || normalized;
  if (!subtitles.has(normalized)) return null;
  const file = thumbs.get(normalized);
  if (!file) return null;
  return `/thumbnails/${encodeURIComponent(file)}`;
}

/**
 * Add a work for a user and extract vocabulary
 * @param {string} userId
 * @param {string} title
 * @param {string} author
 * @param {string} content
 * @returns {{id:string,title:string,author:string,vocab:Object[]}}
 */
async function addWork(userId, title, author, content, type, thumbnailUrl) {
  const id = crypto.randomUUID();
  let text = content;
  if (type === 'movie') {
    const subtitle = getSubtitleTextForTitle(title);
    if (subtitle) {
      text = subtitle;
    }
  }
  const vocab = await chatgpt.extractVocabularyWithLLM(text);
  const vocabWithWork = Array.isArray(vocab)
    ? vocab.map((v) => ({ ...v, workId: id }))
    : [];
  const thumbnail =
    type === 'movie'
      ? getThumbnailForTitle(title) || thumbnailUrl || null
      : null;
  const work = {
    id,
    userId,
    title,
    author,
    content,
    type,
    vocab: vocabWithWork,
    thumbnail,
  };
  works.set(id, work);
  if (vocabWithWork.length) {
    addWords(userId, vocabWithWork);
  }
  return { id, title, author, type, vocab: vocabWithWork, thumbnail };
}

/**
 * List works for a given user
 * @param {string} userId
 * @returns {Array<{id:string,title:string,author:string,vocab:Object[]}>}
 */
function listWorks(userId) {
  return Array.from(works.values())
    .filter((w) => w.userId === userId)
    .map(({ id, title, author, type, vocab, thumbnail }) => ({
      id,
      title,
      author,
      type,
      vocab,
      thumbnail,
    }));
}

function listAllWorks() {
  return Array.from(works.values()).map(
    ({ id, userId, title, author, vocab, thumbnail }) => ({
      id,
      userId,
      title,
      author,
      vocab,
      thumbnail,
    })
  );
}

function deleteWork(id) {
  return works.delete(id);
}

function deleteUserWorks(userId) {
  for (const [id, work] of works.entries()) {
    if (work.userId === userId) {
      works.delete(id);
    }
  }
}

function _clearWorks() {
  works.clear();
}

module.exports = { addWork, listWorks, listAllWorks, deleteWork, deleteUserWorks, _clearWorks };
