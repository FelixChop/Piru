const { it } = require('node:test');
const assert = require('assert');

it(
  'queries OpenAI models endpoint with OPENAI_API_KEY_TEST',
  { skip: !process.env.OPENAI_API_KEY_TEST, concurrency: false, timeout: 60000 },
  async () => {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY_TEST}`,
      },
    });
    assert.ok(res.ok, `expected ok response, got ${res.status}`);
    const body = await res.json();
    assert.ok(Array.isArray(body.data), 'response missing data array');
  }
);
