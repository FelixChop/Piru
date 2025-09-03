#!/usr/bin/env node
// Utility to display a prompt file from the prompts directory.

const fs = require('fs');
const path = require('path');

const promptsDir = path.join(__dirname, '..', 'prompts');

function listPrompts() {
  return fs.readdirSync(promptsDir).filter((file) => {
    const fullPath = path.join(promptsDir, file);
    return fs.statSync(fullPath).isFile();
  });
}

function showPrompt(name) {
  let fileName = name;
  if (!fileName.includes('.')) {
    fileName += '.txt';
  }
  const filePath = path.join(promptsDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`Prompt "${fileName}" not found.`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(content);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    const prompts = listPrompts();
    console.log('Available prompts:');
    for (const p of prompts) {
      console.log(` - ${p}`);
    }
    console.log('\nUsage: node scripts/show-prompt.js <prompt-file>');
    process.exit(0);
  }

  showPrompt(args[0]);
}

main();
