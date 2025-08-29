const express = require('express');
const path = require('path');
const { signup, login } = require('./auth');
const { addWork, listWorks } = require('./works');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

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

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
