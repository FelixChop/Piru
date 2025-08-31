const { it } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { extractVocabularyWithLLM } = require('../src/chatgpt');

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length) || 1;
  return 1 - distance / maxLen;
}

it(
  'queries OpenAI with OPENAI_API_KEY_TEST and prints output',
  { skip: !process.env.OPENAI_API_KEY_TEST, concurrency: false, timeout: 60000 },
  async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY_TEST;
    try {
      const fixturesDir = path.join(__dirname, 'fixtures', 'en-fr');
      const files = fs
        .readdirSync(fixturesDir)
        .filter((f) => f.endsWith('.txt'));
      for (const file of files) {
        const text = fs.readFileSync(path.join(fixturesDir, file), 'utf8');
        const expected = JSON.parse(
          fs.readFileSync(
            path.join(fixturesDir, file.replace('.txt', '.expected.json')),
            'utf8'
          )
        );
        const items = await extractVocabularyWithLLM(text);
        const itemsLemma = items.map((i) => i.lemma).sort().join(' ');
        const expectedLemma = expected.map((i) => i.lemma).sort().join(' ');
        const sim = similarity(itemsLemma, expectedLemma);
        if (sim <= 0.8) {
          console.error('Actual:', items);
          console.error('Expected:', expected);
        }
        assert.ok(
          sim > 0.8,
          `Levenshtein similarity below threshold for ${file}: ${sim}`
        );
      }
    } finally {
      if (originalKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = originalKey;
      }
    }
  }
);
