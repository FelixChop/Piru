const express = require('express');
const path = require('path');
const { signup, login } = require('./auth');
const { addWork, listWorks } = require('./works');
const { getOverview } = require('./stats');

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '..', 'public')));
app.use(
  '/lib/i18next',
  express.static(path.join(__dirname, '..', 'node_modules', 'i18next', 'dist'))
);

if (process.env.NODE_ENV === 'staging') {
  try {
    signup('staging@example.com', 'staging123', 'fr', ['en']);
    // eslint-disable-next-line no-console
    console.log('Staging user ready: staging@example.com / staging123');
  } catch (err) {
    // ignore if user already exists
  }
}

app.post('/auth/signup', (req, res) => {
  const { email, password, nativeLanguage, learningLanguages } = req.body;
  try {
    const user = signup(email, password, nativeLanguage, learningLanguages);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  try {
    const user = login(email, password);
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
