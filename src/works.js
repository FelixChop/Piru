const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const chatgpt = require('./chatgpt');
const { addWords, deleteWorkVocab, getWorkStats } = require('./vocab');

// In-memory store for works and their vocabulary entries
const works = new Map(); // workId -> work object

// Lazy-loaded mapping from normalized movie title -> subtitle filename
let subtitleMap;
// Lazy-loaded mapping from normalized movie title -> thumbnail filename
let thumbnailMap;
let bookMap;

const DEFAULT_THUMBNAILS = {
  movie: '/default-thumbnails/movie.svg',
  series: '/default-thumbnails/movie.svg',
  book: '/default-thumbnails/book.svg',
  song: '/default-thumbnails/song.svg',
  custom: '/default-thumbnails/custom.svg',
};

const SUBTITLE_BATCH_SIZE = 10;

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

async function extractVocabulary(text, meta = {}) {
  const vocabMap = new Map();
  if (!text) return { vocab: [], subtitleDuration: 0 };

  function mergeItems(items) {
    for (const item of items || []) {
      if (!item || !item.word) continue;
      const key = item.word.toLowerCase();
      const incoming = Array.isArray(item.citations)
        ? item.citations
        : item.citation
        ? [item.citation]
        : [];
      const times = Array.isArray(item.timestamps)
        ? item.timestamps
        : item.timestamp !== undefined
        ? [item.timestamp]
        : [];
      if (!vocabMap.has(key)) {
        const citations = incoming.slice(0, 3);
        const first = citations[0];
        vocabMap.set(key, {
          ...item,
          word: item.word, // preserve original casing
          citation: first ?? item.citation,
          citations,
          timestamp: times[0],
          timestamps: times,
        });
      } else {
        const existing = vocabMap.get(key);
        existing.citations = existing.citations || [];
        for (const cit of incoming) {
          if (
            cit &&
            existing.citations.length < 3 &&
            !existing.citations.includes(cit)
          ) {
            existing.citations.push(cit);
          }
        }
        if (!existing.citation && existing.citations.length) {
          existing.citation = existing.citations[0];
        }
        existing.timestamps = existing.timestamps || [];
        for (const t of times) {
          if (t != null && !existing.timestamps.includes(t)) {
            existing.timestamps.push(t);
          }
        }
        if (existing.timestamp == null && existing.timestamps.length) {
          existing.timestamp = existing.timestamps[0];
        }
        if (existing.timestamp != null && times.length) {
          existing.timestamp = Math.min(existing.timestamp, ...times);
        }
      }
    }
  }

  if (meta.isSubtitle) {
    const parseTimestamp = (s) => {
      const m = s.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (!m) return 0;
      const [h, mi, se, ms] = m.slice(1).map(Number);
      return h * 3600 + mi * 60 + se + ms / 1000;
    };
    const blocks = text.split(/\r?\n\r?\n/);
    const subtitles = [];
    let lastTime = 0;
    for (const block of blocks) {
      const lines = block.trim().split(/\r?\n/);
      if (lines.length >= 3) {
        const [startStr, endStr] = lines[1].split(/ --> /);
        const start = parseTimestamp(startStr);
        const end = endStr ? parseTimestamp(endStr) : start;
        if (end > lastTime) lastTime = end;
        const subtitleText = lines.slice(2).join(' ').trim();
        if (subtitleText) subtitles.push({ text: subtitleText, time: start });
      }
    }
    for (let i = 0; i < subtitles.length; i += SUBTITLE_BATCH_SIZE) {
      const batchSubs = subtitles.slice(i, i + SUBTITLE_BATCH_SIZE);
      const batch = batchSubs.map((s) => s.text).join(' ');
      const items = await chatgpt.extractVocabularyWithLLM(
        batch,
        undefined,
        meta
      );
      for (const item of items || []) {
        const cits = Array.isArray(item.citations)
          ? item.citations
          : item.citation
          ? [item.citation]
          : [];
        const ts = [];
        for (const cit of cits) {
          const lc = String(cit).toLowerCase();
          const match = batchSubs.find((sub) => {
            const subText = sub.text.toLowerCase();
            return (
              subText === lc ||
              subText.includes(lc) ||
              lc.includes(subText)
            );
          });
          if (match) {
            ts.push(match.time);
          }
        }
        if (ts.length) {
          item.timestamp = ts[0];
          item.timestamps = ts;
        }
      }
      mergeItems(items);
    }
    const vocabList = Array.from(vocabMap.values()).sort(
      (a, b) => (a.timestamp ?? Infinity) - (b.timestamp ?? Infinity)
    );
    return { vocab: vocabList, subtitleDuration: lastTime };
  } else {
    const CHUNK_SIZE = 10_000;
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      const chunk = text.slice(i, i + CHUNK_SIZE);
      const items = await chatgpt.extractVocabularyWithLLM(
        chunk,
        undefined,
        meta
      );
      mergeItems(items);
    }
    const vocabList = Array.from(vocabMap.values());
    return { vocab: vocabList, subtitleDuration: 0 };
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
async function addWork(userId, title, author, content, type, thumbnailUrl) {
  const id = crypto.randomUUID();
  let pages = [{ page: 1, text: content }];
  let isSubtitle = false;
  if (type === 'movie') {
    const subtitle = getSubtitleTextForTitle(title);
    if (subtitle) {
      pages = [{ page: 1, text: subtitle }];
      isSubtitle = true;
    }
  } else if (type === 'book') {
    const bookPages = await getBookPages(title, author);
    if (bookPages && bookPages.length) {
      pages = bookPages.map((text, idx) => ({ page: idx + 1, text }));
    }
  }
  const vocabPages = [];
  let allVocab = [];
  let subtitleDuration = 0;
  for (const { page, text } of pages) {
    const { vocab, subtitleDuration: sd } = await extractVocabulary(text, {
      title,
      author,
      isSubtitle,
    });
    if (isSubtitle) {
      subtitleDuration = sd;
    }
    const withWork = Array.isArray(vocab)
      ? vocab.map((v) => ({ ...v, workId: id, page }))
      : [];
    vocabPages.push({ page, vocab: withWork });
    allVocab = allVocab.concat(withWork);
  }
  let thumbnail;
  if (type === 'movie' || type === 'series') {
    thumbnail =
      getThumbnailForTitle(title) || thumbnailUrl || DEFAULT_THUMBNAILS[type];
  } else {
    thumbnail = thumbnailUrl || DEFAULT_THUMBNAILS[type] || null;
  }
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
    subtitleDuration,
  };
  works.set(id, work);
  if (allVocab.length) {
    addWords(userId, allVocab);
  }
  return {
    id,
    title,
    author,
    type,
    pages: vocabPages,
    vocab: allVocab,
    thumbnail,
    subtitleDuration,
  };
}

/**
 * List works for a given user
 * @param {string} userId
 * @returns {Array<{id:string,title:string,author:string,vocab:Object[]}>}
 */
function listWorks(userId) {
  return Array.from(works.values())
    .filter((w) => w.userId === userId)
    .map(
      ({
        id,
        title,
        author,
        type,
        vocab,
        pages,
        thumbnail,
        subtitleDuration,
      }) => {
        const { total, learned } = getWorkStats(userId, id);
        const known = vocab.length - total;
        return {
          id,
          title,
          author,
          type,
          vocab,
          pages,
          thumbnail,
          subtitleDuration,
          vocabCount: vocab.length,
          learnedCount: learned,
          knownCount: known,
        };
      }
    );
}

function listAllWorks() {
  return Array.from(works.values()).map(
    ({
      id,
      userId,
      title,
      author,
      vocab,
      pages,
      thumbnail,
      subtitleDuration,
    }) => {
      const { total, learned } = getWorkStats(userId, id);
      const known = vocab.length - total;
      return {
        id,
        userId,
        title,
        author,
        vocab,
        pages,
        thumbnail,
        subtitleDuration,
        vocabCount: vocab.length,
        learnedCount: learned,
        knownCount: known,
      };
    }
  );
}

function deleteWork(id, userId) {
  const work = works.get(id);
  if (!work) return false;
  if (userId && work.userId !== userId) return false;
  works.delete(id);
  deleteWorkVocab(work.userId, id);
  return true;
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

module.exports = {
  extractVocabulary,
  addWork,
  listWorks,
  listAllWorks,
  deleteWork,
  deleteUserWorks,
  _clearWorks,
  SUBTITLE_BATCH_SIZE,
};
