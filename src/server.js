const express = require('express');
const path = require('path');
const session = require('express-session');
const logger = require('./logger');
const { signup, login } = require('./auth');
const { init } = require('./db');
const { addWork, listWorks, listAllWorks, deleteWork, deleteUserWorks } = require('./works');
const { isAdmin, listUsers, deleteUser } = require('./admin');
const { extractVocabularyWithLLM } = require('./chatgpt');
const { getOverview } = require('./stats');
const {
  addWords,
  getNextWord,
  reviewWord,
  deleteUserVocab,
  deleteWord,
} = require('./vocab');
const { getProgress, updateProgress } = require('./progress');
const { createChallenge, submitScore, getChallenge } = require('./challenges');

const app = express();
// Only parse JSON bodies for non-GET/HEAD requests that declare a JSON payload.
const jsonParser = express.json();
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || !req.is('application/json')) {
    return next();
  }
  return jsonParser(req, res, next);
});
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.static(path.resolve(__dirname, '..', 'public')));
app.use(
  '/thumbnails',
  express.static(path.join(__dirname, '..', 'data', 'thumbnails'))
);
app.use(
  '/lib/i18next',
  express.static(path.join(__dirname, '..', 'node_modules', 'i18next', 'dist'))
);

init().then(() => {
  if (process.env.NODE_ENV === 'staging') {
    signup('staging@example.com', 'staging123', 'fr', ['en'])
      .then(() => logger.info('Staging user ready: staging@example.com / staging123'))
      .catch(() => {});
  }
});

app.post('/auth/signup', async (req, res) => {
  const { email, password, nativeLanguage, learningLanguages, isAdmin } = req.body;
  try {
    const user = await signup(email, password, nativeLanguage, learningLanguages, isAdmin);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await login(email, password);
    req.session.userId = user.id;
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Failed to logout' });
    res.status(204).end();
  });
});

// Progress endpoints
app.get('/progress', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const progress = await getProgress(userId);
    if (!progress) return res.status(404).json({ error: 'User not found' });
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load progress' });
  }
});

app.post('/progress', async (req, res) => {
  const userId = req.session.userId;
  const { progressMax, cookies } = req.body;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (typeof progressMax !== 'number' || typeof cookies !== 'number') {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    await updateProgress(userId, progressMax, cookies);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

app.delete('/auth/account', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    // Remove any user-specific data before deleting the actual user record.
    // This prevents potential foreign key constraint errors and keeps the
    // in-memory stores in sync with the database.
    deleteUserWorks(userId);
    deleteUserVocab(userId);
    const deleted = await deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    req.session.destroy(() => {});
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Works endpoints
app.post('/works', async (req, res) => {
  const userId = req.session.userId;
  const { title, author, content, type, thumbnail } = req.body;
  // `content` may be an empty string if no preview text is available, so we only
  // validate that the field exists rather than requiring a truthy value.
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (typeof content === 'undefined' || !type) {
    return res.status(400).json({ error: 'Missing content or type' });
  }
  try {
    const work = await addWork(userId, title, author, content, type, thumbnail);
    res.status(201).json(work);
  } catch (err) {
    res.status(500).json({ error: 'Extraction failed' });
  }
});

app.get('/works', (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const works = listWorks(userId);
  res.json(works);
});

app.delete('/works/:id', (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const ok = deleteWork(req.params.id, userId);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

// Admin endpoints
app.get('/admin/users', async (req, res) => {
  const userId = req.session.userId;
  try {
    if (!(await isAdmin(userId))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const users = await listUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

app.delete('/admin/users/:id', async (req, res) => {
  const userId = req.session.userId;
  try {
    if (!(await isAdmin(userId))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await deleteUser(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/admin/works', async (req, res) => {
  const userId = req.session.userId;
  if (!(await isAdmin(userId))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const works = listAllWorks();
  res.json(works);
});

app.delete('/admin/works/:id', async (req, res) => {
  const userId = req.session.userId;
  if (!(await isAdmin(userId))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const ok = deleteWork(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

// Vocabulary endpoints
app.post('/vocab/extract', async (req, res) => {
  const userId = req.session.userId;
  const { text } = req.body;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!text) {
    return res.status(400).json({ error: 'Missing text' });
  }
  try {
    const vocab = await extractVocabularyWithLLM(text);
    const added = addWords(userId, vocab);
    res.status(201).json(added);
  } catch (err) {
    res.status(500).json({ error: 'Extraction failed' });
  }
});

app.get('/vocab/next', (req, res) => {
  const userId = req.session.userId;
  const { workId } = req.query;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const word = getNextWord(userId, workId);
  if (!word) return res.status(204).end();
  res.json(word);
});

app.post('/vocab/review', (req, res) => {
  const userId = req.session.userId;
  const { wordId, quality } = req.body;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!wordId || typeof quality !== 'number') {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const updated = reviewWord(userId, wordId, quality);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/vocab/:id', (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const ok = deleteWord(userId, req.params.id);
  if (!ok) {
    return res.status(404).json({ error: 'User or word not found' });
  }
  res.status(204).end();
});

// Challenge endpoints
app.post('/challenges', (req, res) => {
  const userId = req.session.userId;
  const { workId } = req.body;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!workId) {
    return res.status(400).json({ error: 'Missing workId' });
  }
  const { id } = createChallenge(workId, userId);
  res.status(201).json({ id });
});

app.post('/challenges/:id/score', (req, res) => {
  const userId = req.session.userId;
  const { score } = req.body;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (typeof score !== 'number') {
    return res.status(400).json({ error: 'Missing score' });
  }
  const challenge = submitScore(req.params.id, userId, score);
  if (!challenge) return res.status(404).json({ error: 'Not found' });
  res.json(challenge);
});

app.get('/challenges/:id', (req, res) => {
  const challenge = getChallenge(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Not found' });
  res.json(challenge);
});

// Lyrics endpoints
app.get('/api/lyrics/search', async (req, res) => {
  const { q } = req.query;
  try {
    const r = await fetch(
      `https://api.lyrics.ovh/suggest/${encodeURIComponent(q)}`
    );
    res.json(await r.json());
  } catch (err) {
    res.status(500).json({ error: 'Failed to search lyrics' });
  }
});

app.get('/api/lyrics/text', async (req, res) => {
  const { artist, title } = req.query;
  try {
    const r = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    );
    res.json(await r.json());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
});

// Stats endpoints
app.get('/stats/overview', (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const overview = getOverview(userId);
  res.json(overview);
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });
}

module.exports = app;
