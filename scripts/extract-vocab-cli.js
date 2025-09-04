#!/usr/bin/env node
// CLI to extract difficult vocabulary from a text file using existing app logic
// Example: node scripts/extract-vocab-cli.js text.txt --title "Book Title" --author "Author"

const fs = require('fs');
const { extractVocabulary } = require('../src/works');

async function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node scripts/extract-vocab-cli.js <file> [--title <title>] [--author <author>]');
    process.exit(1);
  }

  const file = process.argv[2];
  const args = process.argv.slice(3);
  const meta = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      meta.title = args[++i];
    } else if (args[i] === '--author' && args[i + 1]) {
      meta.author = args[++i];
    } else if (args[i] === '--subtitles') {
      meta.isSubtitle = true;
    }
  }
  const text = fs.readFileSync(file, 'utf8');

  try {
    console.error('Extracting vocabulary...');
    const { vocab } = await extractVocabulary(text, meta);
    console.log(JSON.stringify(vocab, null, 2));
  } catch (err) {
    console.error('Extraction failed', err.message);
    process.exit(1);
  }
}

main();
