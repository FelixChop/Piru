#!/usr/bin/env node
// CLI to extract difficult vocabulary from a text file using existing app logic
// Example: node scripts/extract-vocab-cli.js test/fixtures/en-fr/sample-1.txt

const fs = require('fs');
const { extractVocabularyWithLLM } = require('../src/chatgpt');

const CHUNK_SIZE = 10_000; // characters per chunk

async function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node scripts/extract-vocab-cli.js <file>');
    process.exit(1);
  }

  const file = process.argv[2];
  const text = fs.readFileSync(file, 'utf8');

  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  const vocabMap = new Map();

  try {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.error(`Processing chunk ${i + 1}/${chunks.length}`);
      const items = await extractVocabularyWithLLM(chunk);
      for (const item of items) {
        if (item && item.word && !vocabMap.has(item.word)) {
          vocabMap.set(item.word, item);
        }
      }
    }
    const vocab = Array.from(vocabMap.values());
    console.log(JSON.stringify(vocab, null, 2));
  } catch (err) {
    console.error('Extraction failed', err.message);
    process.exit(1);
  }
}

main();
