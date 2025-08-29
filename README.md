# Piru

Consume media in foreign languages by translating only the difficult vocabulary and by learning it.

## Project Specification

See [SPEC.md](./SPEC.md) for the detailed product and technical specification of the MVP.

## Development

Install dependencies:

```bash
npm install
```

Run the test suite:

```bash
npm test
```

Initialize the local SQLite database (creates tables if they don't exist):

```bash
npm run init-db
```

### Algorithms

The `src/sm2.js` module implements the SM-2 spaced repetition algorithm used
for scheduling flashcard reviews.
