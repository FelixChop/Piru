#!/usr/bin/env node
// CLI to extract difficult vocabulary from a text file using existing app logic
// Example: node scripts/extract-vocab-cli.js test/fixtures/en-fr/sample.txt

const fs = require('fs');
const { extractVocabulary } = require('../src/works');

if (process.argv.length < 3) {
  console.error('Usage: node scripts/extract-vocab-cli.js <file>');
  process.exit(1);
}

const file = process.argv[2];
const text = fs.readFileSync(file, 'utf8');
const vocab = extractVocabulary(text);
for (const { word } of vocab) {
  console.log(word);
}
