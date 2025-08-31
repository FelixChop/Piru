const express = require('express');
const path = require('path');
const { signup, login } = require('./auth');
const { init } = require('./db');
const { addWork, listWorks, listAllWorks, deleteWork } = require('./works');
const { isAdmin, listUsers, deleteUser } = require('./admin');
const { extractVocabularyWithLLM } = require('./chatgpt');
const { getOverview } = require('./stats');
const { addWords, getNextWord, reviewWord } = require('./vocab');

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '..', 'public')));
app.use(
  '/lib/i18next',
  express.static(path.join(__dirname, '..', 'node_modules', 'i18next', 'dist'))
);

init().then(() => {
  if (process.env.NODE_ENV === 'staging') {
    signup('staging@example.com', 'staging123', 'fr', ['en'])
      // eslint-disable-next-line no-console
      .then(() => console.log('Staging user ready: staging@example.com / staging123'))
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
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Works endpoints
app.post('/works', async (req, res) => {
  const { userId, title, author, content, type } = req.body;
  // `content` may be an empty string if no preview text is available, so we only
  // validate that the field exists rather than requiring a truthy value.
  if (!userId || typeof content === 'undefined' || !type) {
    return res.status(400).json({ error: 'Missing userId, content, or type' });
  }
  try {
    const work = await addWork(userId, title, author, content, type);
    res.status(201).json(work);
  } catch (err) {
    res.status(500).json({ error: 'Extraction failed' });
  }
});

app.get('/works', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  const works = listWorks(userId);
  res.json(works);
});

// Admin endpoints
app.get('/admin/users', async (req, res) => {
  const { userId } = req.query;
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
  const { userId } = req.query;
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
  const { userId } = req.query;
  if (!(await isAdmin(userId))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const works = listAllWorks();
  res.json(works);
});

app.delete('/admin/works/:id', async (req, res) => {
  const { userId } = req.query;
  if (!(await isAdmin(userId))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const ok = deleteWork(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

// Vocabulary endpoints
app.post('/vocab/extract', async (req, res) => {
  const { userId, text } = req.body;
  if (!userId || !text) {
    return res.status(400).json({ error: 'Missing userId or text' });
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
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  const word = getNextWord(userId);
  if (!word) return res.status(204).end();
  res.json(word);
});

app.post('/vocab/review', (req, res) => {
  const { userId, wordId, quality } = req.body;
  if (!userId || !wordId || typeof quality !== 'number') {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const updated = reviewWord(userId, wordId, quality);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  const overview = getOverview(userId);
  res.json(overview);
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
