import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

// ponytail: one connection for the whole process, created lazily and cached on
// globalThis so Next's dev-mode hot reload doesn't open a new handle per edit.
// Single-user app, so no pool. If this ever served real concurrency, this is
// the first thing that would have to change.
declare global {
  var __todoDb: DatabaseSync | undefined;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id       TEXT PRIMARY KEY,
  email    TEXT UNIQUE NOT NULL,
  pw_hash  TEXT NOT NULL,
  pw_salt  TEXT NOT NULL,
  created  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token    TEXT PRIMARY KEY,
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS databases (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  title_label  TEXT NOT NULL DEFAULT 'Name',
  done_label   TEXT NOT NULL DEFAULT 'Done',
  created      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS properties (
  id       TEXT PRIMARY KEY,
  db_id    TEXT NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  type     TEXT NOT NULL CHECK (type IN ('text','number','select','date','checkbox')),
  options  TEXT,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id       TEXT PRIMARY KEY,
  db_id    TEXT NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
  title    TEXT NOT NULL,
  done     INTEGER NOT NULL DEFAULT 0,
  props    TEXT NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL,
  created  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user  ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_databases_user ON databases(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_db  ON properties(db_id);
CREATE INDEX IF NOT EXISTS idx_tasks_db       ON tasks(db_id);
`;

export function getDb(): DatabaseSync {
  if (globalThis.__todoDb) return globalThis.__todoDb;

  const file = process.env.TODO_DB ?? path.join(process.cwd(), 'todo.db');
  const db = new DatabaseSync(file);
  const runSql = db.exec.bind(db);

  // Without this, the ON DELETE CASCADE clauses above are silently ignored.
  // SQLite defaults foreign key enforcement to OFF for backwards compatibility.
  runSql('PRAGMA foreign_keys = ON');
  runSql(SCHEMA);
  migrate(db, runSql);

  globalThis.__todoDb = db;
  return db;
}

/**
 * CREATE TABLE IF NOT EXISTS does nothing to a table that already exists, so a
 * database file created before a column was added would silently lack it.
 * ponytail: no migrations framework for two columns. Check the actual table
 * shape and add what is missing. Idempotent, so it is safe on every boot.
 */
function migrate(db: DatabaseSync, runSql: (sql: string) => void) {
  const cols = (db.prepare('PRAGMA table_info(databases)').all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes('title_label')) runSql("ALTER TABLE databases ADD COLUMN title_label TEXT NOT NULL DEFAULT 'Name'");
  if (!cols.includes('done_label')) runSql("ALTER TABLE databases ADD COLUMN done_label TEXT NOT NULL DEFAULT 'Done'");
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
