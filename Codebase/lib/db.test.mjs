import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

// Pull the schema string straight out of db.ts so the test cannot drift from
// the real schema. Crude, but it means one source of truth.
const src = readFileSync(new URL('./db.ts', import.meta.url), 'utf8');
const SCHEMA = src.split('const SCHEMA = `')[1].split('`;')[0];

function fresh() {
  const db = new DatabaseSync(':memory:');
  const runSql = db.exec.bind(db);
  runSql('PRAGMA foreign_keys = ON');
  runSql(SCHEMA);
  return db;
}

test('schema applies cleanly and creates all five tables', () => {
  const db = fresh();
  const names = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all()
    .map((r) => r.name);
  for (const t of ['databases', 'properties', 'sessions', 'tasks', 'users']) {
    assert.ok(names.includes(t), `missing table: ${t}`);
  }
});

test('email is unique', () => {
  const db = fresh();
  const ins = db.prepare('INSERT INTO users (id,email,pw_hash,pw_salt,created) VALUES (?,?,?,?,?)');
  ins.run('u1', 'a@b.com', 'h', 's', 'now');
  assert.throws(() => ins.run('u2', 'a@b.com', 'h', 's', 'now'));
});

test('property type is constrained to the five supported types', () => {
  const db = fresh();
  db.prepare('INSERT INTO users (id,email,pw_hash,pw_salt,created) VALUES (?,?,?,?,?)').run('u1', 'a@b.com', 'h', 's', 'now');
  db.prepare('INSERT INTO databases (id,user_id,name,created) VALUES (?,?,?,?)').run('d1', 'u1', 'Tasks', 'now');

  const ins = db.prepare('INSERT INTO properties (id,db_id,name,type,options,position) VALUES (?,?,?,?,?,?)');
  for (const t of ['text', 'number', 'select', 'date', 'checkbox']) {
    ins.run(`p_${t}`, 'd1', t, t, null, 0);
  }
  assert.throws(() => ins.run('p_bad', 'd1', 'Bad', 'multiselect', null, 0));
});

test('deleting a user cascades to databases, properties and tasks', () => {
  const db = fresh();
  db.prepare('INSERT INTO users (id,email,pw_hash,pw_salt,created) VALUES (?,?,?,?,?)').run('u1', 'a@b.com', 'h', 's', 'now');
  db.prepare('INSERT INTO databases (id,user_id,name,created) VALUES (?,?,?,?)').run('d1', 'u1', 'Tasks', 'now');
  db.prepare('INSERT INTO properties (id,db_id,name,type,options,position) VALUES (?,?,?,?,?,?)').run('p1', 'd1', 'Priority', 'select', '["High"]', 0);
  db.prepare('INSERT INTO tasks (id,db_id,title,done,props,position,created) VALUES (?,?,?,?,?,?,?)').run('t1', 'd1', 'Ship it', 0, '{}', 0, 'now');

  db.prepare('DELETE FROM users WHERE id = ?').run('u1');

  assert.equal(db.prepare('SELECT COUNT(*) c FROM databases').get().c, 0);
  assert.equal(db.prepare('SELECT COUNT(*) c FROM properties').get().c, 0);
  assert.equal(db.prepare('SELECT COUNT(*) c FROM tasks').get().c, 0);
});

test('a task cannot reference a database that does not exist', () => {
  const db = fresh();
  assert.throws(() =>
    db
      .prepare('INSERT INTO tasks (id,db_id,title,done,props,position,created) VALUES (?,?,?,?,?,?,?)')
      .run('t1', 'nope', 'Orphan', 0, '{}', 0, 'now')
  );
});
