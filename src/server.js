const express = require('express');
const path = require('path');
const { signup, login } = require('./auth');
const { init } = require('./db');
const { addWork, listWorks } = require('./works');
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
  const { email, password, nativeLanguage, learningLanguages } = req.body;
  try {
    const user = await signup(email, password, nativeLanguage, learningLanguages);
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
app.post('/works', (req, res) => {
  const { userId, title, author, content } = req.body;
  if (!userId || !content) {
    return res.status(400).json({ error: 'Missing userId or content' });
  }
  const work = addWork(userId, title, author, content);
  res.status(201).json(work);
});

app.get('/works', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  const works = listWorks(userId);
  res.json(works);
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
