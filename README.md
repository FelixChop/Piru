# Piru

Consume media in foreign languages by translating only the difficult vocabulary and by learning it.

## Project Specification

See [SPEC.md](./SPEC.md) for the detailed product and technical specification of the MVP.

## Development

Install dependencies:

```bash
npm install
```

Configure the OpenAI API key (used for vocabulary extraction):

```bash
cp .env.example .env
# then edit .env and set OPENAI_API_KEY
```

The `.env` file is ignored by git so your API key stays private.

Run the test suite:

```bash
npm test
```

Initialize the local SQLite database (creates tables if they don't exist):

```bash
npm run init-db
```

### Staging environment

Run a local staging server with a pre-created test account:

```bash
npm run init-db:staging   # optional, creates a separate staging database
npm run start:staging
```

The staging server listens on port 4000 and exposes the account `staging@example.com` with password `staging123`.

### Algorithms

The `src/sm2.js` module implements the SM-2 spaced repetition algorithm used
for scheduling flashcard reviews.
