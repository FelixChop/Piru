const { describe, it, afterEach } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const promptPath = path.join(
  __dirname,
  '..',
  'src',
  'prompts',
  'extract-vocabulary.txt'
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
                content: JSON.stringify([
                  { word: 'mockword', definition: 'mock def', citation: 'mock cit' },
                ]),
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
    const { extractVocabularyWithLLM } = require('../src/chatgpt');
    const items = await extractVocabularyWithLLM('sample text', outputPath);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].word, 'mockword');
    const prompt = fs.readFileSync(promptPath, 'utf8').trim();
    assert.ok(captured.messages[1].content.startsWith(prompt));
    assert.ok(fs.existsSync(outputPath));
    const fileItems = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    assert.strictEqual(fileItems.length, 1);
    assert.strictEqual(fileItems[0].word, 'mockword');
  });

  it('falls back to default prompt if file read fails', async () => {
    let captured;
    global.fetch = async (url, options) => {
      captured = JSON.parse(options.body);
      return {
        json: async () => ({ choices: [{ message: { content: '[]' } }] }),
      };
    };
    fs.readFileSync = (p, ...args) => {
      if (p === promptPath) {
        throw new Error('fail');
      }
      return originalRead(p, ...args);
    };
    outputPath = path.join(
      __dirname,
      `difficult-words-${crypto.randomUUID()}.json`
    );
    const { extractVocabularyWithLLM } = require('../src/chatgpt');
    const items = await extractVocabularyWithLLM('text', outputPath);
    assert.strictEqual(items.length, 0);
    assert.ok(
      captured.messages[1].content.startsWith(
        'Extract vocabulary from the following text.'
      )
    );
    assert.ok(fs.existsSync(outputPath));
    const fileItems = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    assert.deepStrictEqual(fileItems, []);
  });
});

