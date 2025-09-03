#!/usr/bin/env node
// Simple script to test vocabulary extraction from sample subtitle files
// Usage: node scripts/test-subtitle-vocab.js

const fs = require('fs');
const path = require('path');
const chatgpt = require('../src/chatgpt');

// This script now uses the real OpenAI API via chatgpt.extractVocabularyWithLLM.
// Ensure the environment variable OPENAI_API_KEY is set before running it.

async function extractFromSubtitle(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const blocks = text.split(/\r?\n\r?\n/);
  const subtitles = [];
  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/);
    if (lines.length >= 3) {
      const subtitleText = lines.slice(2).join(' ').trim();
      if (subtitleText) subtitles.push(subtitleText);
    }
  }
  const vocabMap = new Map();
  for (let i = 0; i < subtitles.length; i += 3) {
    const batch = subtitles.slice(i, i + 3).join(' ');
    const items = await chatgpt.extractVocabularyWithLLM(batch);
    for (const item of items) {
      if (item && item.word && !vocabMap.has(item.word)) {
        vocabMap.set(item.word, item);
      }
    }
  }
  return Array.from(vocabMap.values());
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.log('OPENAI_API_KEY not set, skipping vocabulary extraction test.');
    return;
  }
  const base = path.join(__dirname, '..', 'data', 'subtitles', 'en');
  const files = ['test-movie.srt', 'test-idioms.srt'];
  for (const file of files) {
    const vocab = await extractFromSubtitle(path.join(base, file));
    console.log(`Vocabulary extracted from ${file}:`);
    console.log(vocab.map((v) => v.word).join(', '));
    console.log();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Failed to extract vocabulary:', err);
    process.exit(1);
  });
}

