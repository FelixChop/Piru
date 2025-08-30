const { it } = require('node:test');
const assert = require('assert');
const { extractVocabularyWithLLM } = require('../src/chatgpt');

it(
  'queries OpenAI with OPENAI_API_KEY_TEST and prints output',
  { skip: !process.env.OPENAI_API_KEY_TEST, concurrency: false, timeout: 60000 },
  async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY_TEST;
    try {
      const text = 'Our house is old, cold, and green. At night a kerosene lamp lights one large room. The others are braced in darkness, peopled by roaches and mice. Adults do not talk to us\u2014they give us directions. They issue orders without providing information. When we trip and fall down they glance at us; if we cut or bruise ourselves, they ask us are we crazy. When we catch colds, they shake their heads in disgust at our lack of consideration. How, they ask us, do you expect anybody to get anything done if you all are sick? We cannot answer them. Our illness is treated with contempt, foul Black Draught, and castor oil that blunts our minds.';
      const items = await extractVocabularyWithLLM(text);
      console.log(items);
      assert.ok(Array.isArray(items));
      assert.ok(items.length > 0);
    } finally {
      if (originalKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = originalKey;
      }
    }
  }
);
