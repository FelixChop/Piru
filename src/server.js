const express = require('express');
const { signup, login } = require('./auth');

const app = express();
app.use(express.json());

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

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
