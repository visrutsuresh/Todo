/**
 * Creates a demo account with a populated database, so anyone running this for
 * the first time sees a working app instead of an empty signup form.
 *
 * Safe to re-run: if the demo user already exists it stops and changes nothing.
 * Imports the real hashing and schema code rather than reimplementing either,
 * so a seeded password is verified by exactly the same path as a real one.
 */
import { getDb, newId, nowIso } from '../lib/db.ts';
import { hashPassword } from '../lib/password.ts';

const EMAIL = 'demo@shopback.test';
const PASSWORD = 'hunter2hunter2';

const db = getDb();

if (db.prepare('SELECT id FROM users WHERE email = ?').get(EMAIL)) {
  console.log(`Already seeded. Sign in as ${EMAIL} / ${PASSWORD}`);
  process.exit(0);
}

const { hash, salt } = hashPassword(PASSWORD);
const userId = newId();
db.prepare('INSERT INTO users (id, email, pw_hash, pw_salt, created) VALUES (?, ?, ?, ?, ?)').run(
  userId,
  EMAIL,
  hash,
  salt,
  nowIso()
);

function database(name) {
  const id = newId();
  db.prepare('INSERT INTO databases (id, user_id, name, created) VALUES (?, ?, ?, ?)').run(id, userId, name, nowIso());
  return id;
}

function property(dbId, name, type, options, position) {
  const id = newId();
  db.prepare('INSERT INTO properties (id, db_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)').run(
    id,
    dbId,
    name,
    type,
    options ? JSON.stringify(options) : null,
    position
  );
  return id;
}

function task(dbId, title, done, props, position) {
  db.prepare(
    'INSERT INTO tasks (id, db_id, title, done, props, position, created) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(newId(), dbId, title, done ? 1 : 0, JSON.stringify(props), position, nowIso());
}

/* seeded FIRST so that Sprint Board ends up most recent, and is therefore the
   database the app opens on. Databases are listed newest first. */
const personal = database('Personal');
const area = property(personal, 'Area', 'select', ['Home', 'Errand'], 0);
const personalNotes = property(personal, 'Notes', 'text', null, 1);

task(personal, 'Renew passport', false, { [area]: 'Errand', [personalNotes]: 'Book an appointment first' }, 0);
task(personal, 'Water the plants', true, { [area]: 'Home' }, 1);

/* seeded LAST so it opens by default. Carries one property of EVERY type. */
const sprint = database('Sprint Board');
const status = property(sprint, 'Status', 'select', ['Todo', 'Doing', 'Done'], 0);
const priority = property(sprint, 'Priority', 'select', ['Low', 'High'], 1);
const estimate = property(sprint, 'Estimate', 'number', null, 2);
const due = property(sprint, 'Due', 'date', null, 3);
const blocked = property(sprint, 'Blocked', 'checkbox', null, 4);
const notes = property(sprint, 'Notes', 'text', null, 5);

task(sprint, 'Design the schema', true, { [status]: 'Done', [priority]: 'High', [estimate]: 2, [due]: '2026-08-24' }, 0);
task(sprint, 'Wire up auth', true, { [status]: 'Done', [priority]: 'High', [estimate]: 3, [due]: '2026-08-25' }, 1);
task(sprint, 'Build the table view', false, { [status]: 'Doing', [priority]: 'High', [estimate]: 5, [due]: '2026-08-26', [notes]: 'Inline editing per cell' }, 2);
task(sprint, 'Board drag and drop', false, { [status]: 'Todo', [priority]: 'Low', [estimate]: 3, [due]: '2026-08-27', [blocked]: true, [notes]: 'Waiting on the table view' }, 3);
// Deliberately has no Status: shows the board's "No value" column doing its job.
task(sprint, 'Write the reflection', false, { [priority]: 'High', [estimate]: 1 }, 4);

console.log(`Seeded. Sign in at http://localhost:3000 as ${EMAIL} / ${PASSWORD}`);
