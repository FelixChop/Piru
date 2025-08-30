const { it } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { extractVocabularyWithLLM } = require('../src/chatgpt');

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
        console.log(items);
        assert.deepStrictEqual(items, expected);
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
