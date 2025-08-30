const crypto = require('crypto');
require('dotenv').config();

async function extractVocabularyWithLLM(text) {
  if (!text || !text.trim()) return [];
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }

  const prompt = `Extract vocabulary from the following text. ` +
    `Return a JSON array where each item has: word, definition (in French), and citation from the text. ` +
    `Only return JSON.`;

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

  return items.map((item) => ({
    id: crypto.randomUUID(),
    word: item.word,
    definition: item.definition,
    citations: [item.citation],
    status: 'new',
  }));
}

module.exports = { extractVocabularyWithLLM };

