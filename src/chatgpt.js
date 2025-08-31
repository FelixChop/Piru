const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

const promptTemplate = fs.readFileSync(
  path.join(
    __dirname,
    '..',
    'prompts',
    'extract-vocabulary-en-fr.txt'
  ),
  'utf8'
);

async function extractVocabularyWithLLM(text, outPath) {
  if (!text || !text.trim()) return [];
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }

  const userPrompt = promptTemplate.replace('"""TEXT"""', text);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts vocabulary.',
        },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'vocabulary_list',
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    word: { type: 'string' },
                    definition: { type: 'string' },
                    citation: { type: 'string' },
                  },
                  required: ['word', 'definition', 'citation'],
                  additionalProperties: false,
                },
              },
            },
            required: ['items'],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  const data = await res.json();
  if (res.ok === false || data.error) {
    console.error('OpenAI API error', data);
    return [];
  }

  let items = [];
  const rawContent = data.choices?.[0]?.message?.content?.trim() || '{}';
  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err) {
    const match =
      data.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch (err2) {
        console.error('Failed to parse JSON substring', err2);
      }
    } else {
      console.error('Failed to parse LLM response', err);
    }
  }

  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (parsed && Array.isArray(parsed.items)) {
    items = parsed.items;
  } else if (parsed) {
    items = [parsed];
  }

  if (!Array.isArray(items)) {
    items = [items];
  }

  try {
    const outputPath =
      outPath ||
      path.join(
        os.tmpdir(),
        `difficult-words-${crypto.randomUUID()}.json`
      );
    fs.writeFileSync(outputPath, JSON.stringify(items, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write difficult words file', err);
  }

  return items;
}

module.exports = { extractVocabularyWithLLM };

