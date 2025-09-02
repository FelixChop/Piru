const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const chatgpt = require('./chatgpt');
const { addWords } = require('./vocab');

// In-memory store for works and their vocabulary entries
const works = new Map(); // workId -> work object

// Lazy-loaded mapping from normalized movie title -> subtitle filename
let subtitleMap;
// Lazy-loaded mapping from normalized movie title -> thumbnail filename
let thumbnailMap;
let bookMap;

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/\(\d{4}\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeAuthor(author) {
  return author
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .sort()
    .join(' ');
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

function loadBookMap() {
  if (bookMap) return bookMap;
  bookMap = new Map();
  try {
    const csvPath = path.join(__dirname, '..', 'data', 'books', 'mapping.csv');
    const csv = fs.readFileSync(csvPath, 'utf8');
    const lines = csv.split(/\r?\n/).slice(1);
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(/","/).map((s) => s.replace(/^"|"$/g, ''));
      const key = `${normalizeAuthor(parts[0])}|${normalizeTitle(parts[1])}`;
      bookMap.set(key, parts[2]);
    }
  } catch (err) {
    // mapping file missing or unreadable
  }
  return bookMap;
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

async function extractPagesFromEpub(filePath) {
  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);
  const files = Object.keys(zip.files)
    .filter((f) => /\.(x?html)$/i.test(f))
    .sort();
  const pages = [];
  for (const filename of files) {
    const content = await zip.files[filename].async('string');
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    pages.push(text);
  }
  return pages;
}

async function getBookPages(title, author) {
  const map = loadBookMap();
  const key = `${normalizeAuthor(author)}|${normalizeTitle(title)}`;
  const filename = map.get(key);
  if (!filename) return null;
  const filePath = path.join(__dirname, '..', 'data', 'books', 'en', filename);
  try {
    return await extractPagesFromEpub(filePath);
  } catch (err) {
    return null;
  }
}

async function extractVocabulary(text) {
  const CHUNK_SIZE = 10_000;
  const vocabMap = new Map();
  if (!text) return [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    const chunk = text.slice(i, i + CHUNK_SIZE);
    const items = await chatgpt.extractVocabularyWithLLM(chunk);
    for (const item of items || []) {
      if (item && item.word && !vocabMap.has(item.word)) {
        vocabMap.set(item.word, item);
      }
    }
  }
  return Array.from(vocabMap.values());
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
  let pages = [{ page: 1, text: content }];
  if (type === 'movie') {
    const subtitle = getSubtitleTextForTitle(title);
    if (subtitle) {
      pages = [{ page: 1, text: subtitle }];
    }
  } else if (type === 'book') {
    const bookPages = await getBookPages(title, author);
    if (bookPages && bookPages.length) {
      pages = bookPages.map((text, idx) => ({ page: idx + 1, text }));
    }
  }
  const vocabPages = [];
  let allVocab = [];
  for (const { page, text } of pages) {
    const vocab = await extractVocabulary(text);
    const withWork = Array.isArray(vocab)
      ? vocab.map((v) => ({ ...v, workId: id, page }))
      : [];
    vocabPages.push({ page, vocab: withWork });
    allVocab = allVocab.concat(withWork);
  }
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
    pages: vocabPages,
    vocab: allVocab,
    thumbnail,
  };
  works.set(id, work);
  if (allVocab.length) {
    addWords(userId, allVocab);
  }
  return { id, title, author, type, pages: vocabPages, vocab: allVocab, thumbnail };
}

/**
 * List works for a given user
 * @param {string} userId
 * @returns {Array<{id:string,title:string,author:string,vocab:Object[]}>}
 */
function listWorks(userId) {
  return Array.from(works.values())
    .filter((w) => w.userId === userId)
    .map(({ id, title, author, type, vocab, pages, thumbnail }) => ({
      id,
      title,
      author,
      type,
      vocab,
      pages,
      thumbnail,
    }));
}

function listAllWorks() {
  return Array.from(works.values()).map(
    ({ id, userId, title, author, vocab, pages, thumbnail }) => ({
      id,
      userId,
      title,
      author,
      vocab,
      pages,
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
