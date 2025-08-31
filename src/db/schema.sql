-- Database schema for Piru MVP

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    native_language TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_languages (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    PRIMARY KEY (user_id, language_code)
);

CREATE TABLE IF NOT EXISTS works (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vocab_entries (
    id UUID PRIMARY KEY,
    work_id UUID REFERENCES works(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    definition TEXT,
    status TEXT DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY,
    vocab_entry_id UUID REFERENCES vocab_entries(id) ON DELETE CASCADE,
    quote TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vocab_entry_id UUID REFERENCES vocab_entries(id) ON DELETE CASCADE,
    scheduled_at DATE NOT NULL,
    interval INTEGER NOT NULL,
    repetitions INTEGER NOT NULL,
    easiness REAL NOT NULL
);
