const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

let prompt;
try {
  prompt = fs.readFileSync(
    path.join(__dirname, 'prompts', 'extract-vocabulary.txt'),
    'utf8'
  );
} catch (err) {
  console.error('Failed to load prompt file', err);
  prompt =
    `Extract vocabulary from the following text. ` +
    `Return a JSON array where each item has: word, definition (in French), and citation from the text. ` +
    `Only return JSON.`;
}

async function extractVocabularyWithLLM(text, outPath) {
  if (!text || !text.trim()) return [];
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that extracts vocabulary.' },
        { role: 'user', content: `${prompt}\n\nText:\n"""${text}"""` },
      ],
    }),
  });

  const data = await res.json();
  let items = [];
  try {
    const content = data.choices?.[0]?.message?.content?.trim() || '[]';
    items = JSON.parse(content);
  } catch (err) {
    console.error('Failed to parse LLM response', err);
    items = [];
  }

  const mapped = items.map((item) => ({
    id: crypto.randomUUID(),
    word: item.word,
    definition: item.definition,
    citations: [item.citation],
    status: 'new',
  }));

  try {
    const outputPath =
      outPath ||
      path.join(
        os.tmpdir(),
        `difficult-words-${crypto.randomUUID()}.json`
      );
    fs.writeFileSync(outputPath, JSON.stringify(mapped, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write difficult words file', err);
  }

  return mapped;
}

module.exports = { extractVocabularyWithLLM };

