const { describe, it, afterEach } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const promptPath = path.join(
  __dirname,
  '..',
  'prompts',
  'extract-vocabulary-en-fr.txt'
);
let outputPath;
const originalFetch = global.fetch;
const originalRead = fs.readFileSync;

process.env.OPENAI_API_KEY = 'test';

describe('extractVocabularyWithLLM', { concurrency: false }, () => {
  afterEach(() => {
    global.fetch = originalFetch;
    fs.readFileSync = originalRead;
    if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    delete require.cache[require.resolve('../src/chatgpt')];
  });

  it('loads prompt from file and writes output', async () => {
    let captured;
    global.fetch = async (url, options) => {
      captured = JSON.parse(options.body);
      return {
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  items: [
                    { word: 'mockword', definition: 'mock def', citation: 'mock cit' },
                  ],
                }),
              },
            },
          ],
        }),
      };
    };
    outputPath = path.join(
      __dirname,
      `difficult-words-${crypto.randomUUID()}.json`
    );
    const sampleText = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'en-fr', 'sample-1.txt'),
      'utf8'
    );
    const { extractVocabularyWithLLM } = require('../src/chatgpt');
    const items = await extractVocabularyWithLLM(sampleText, outputPath, {
      title: 'Sample Title',
      author: 'Sample Author',
    });
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].word, 'mockword');
    const promptTemplate = fs.readFileSync(promptPath, 'utf8');
    const expected = promptTemplate
      .replace('"""TITLE"""', 'Sample Title')
      .replace('"""AUTHOR"""', 'Sample Author')
      .replace('"""TEXT"""', sampleText)
      .trim();
    assert.strictEqual(captured.messages[1].content.trim(), expected);
    assert.ok(fs.existsSync(outputPath));
    const fileItems = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    assert.strictEqual(fileItems.length, 1);
    assert.strictEqual(fileItems[0].word, 'mockword');
  });

  it('wraps single object responses into an array', async () => {
    global.fetch = async () => ({
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                word: 'solo',
                definition: 'one',
                citation: 'mock',
              }),
            },
          },
        ],
      }),
    });

    outputPath = path.join(
      __dirname,
      `difficult-words-${crypto.randomUUID()}.json`
    );

    const { extractVocabularyWithLLM } = require('../src/chatgpt');
    await extractVocabularyWithLLM('sample', outputPath);

  });

  it('throws if prompt file read fails', () => {
    fs.readFileSync = (p, ...args) => {
      if (p === promptPath) {
        throw new Error('fail');
      }
      return originalRead(p, ...args);
    };
    assert.throws(() => require('../src/chatgpt'));
  });
});

