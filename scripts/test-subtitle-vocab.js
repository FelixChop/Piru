#!/usr/bin/env node
// Simple script to test vocabulary extraction from sample subtitle files
// Usage: node scripts/test-subtitle-vocab.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chatgpt = require('../src/chatgpt');

// Stub vocabulary extraction to avoid external API calls.
// This mirrors the approach used in tests, extracting unique words.
chatgpt.extractVocabularyWithLLM = async (content) => {
  const tokens = content.toLowerCase().match(/\b\w+\b/g) || [];
  const unique = Array.from(new Set(tokens));
  return unique.map((word) => ({
    id: crypto.randomUUID(),
    word,
    definition: '',
    citations: [],
    status: 'new',
  }));
};

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
  const base = path.join(__dirname, '..', 'data', 'subtitles', 'en');
  const files = ['test-movie.srt', 'test-idioms.srt'];
  for (const file of files) {
    const vocab = await extractFromSubtitle(path.join(base, file));
    console.log(`Vocabulary extracted from ${file}:`);
    console.log(vocab.map((v) => v.word).join(', '));
    console.log();
  }
}

main().catch((err) => {
  console.error('Failed to extract vocabulary:', err);
  process.exit(1);
});

