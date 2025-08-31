#!/usr/bin/env node
// CLI to extract difficult vocabulary from a text file using existing app logic
// Example: node scripts/extract-vocab-cli.js test/fixtures/en-fr/sample.txt

const fs = require('fs');
const { extractVocabularyWithLLM } = require('../src/chatgpt');

async function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node scripts/extract-vocab-cli.js <file>');
    process.exit(1);
  }

  const file = process.argv[2];
  const text = fs.readFileSync(file, 'utf8');
  try {
    const vocab = await extractVocabularyWithLLM(text);
    for (const { word } of vocab) {
      console.log(word);
    }
  } catch (err) {
    console.error('Extraction failed', err.message);
    process.exit(1);
  }
}

main();
