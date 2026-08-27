import { getDb, newId, nowIso } from './db';
import type { Property, Task, PropType } from './props';

type PropRow = { id: string; db_id: string; name: string; type: PropType; options: string | null; position: number };
type TaskRow = { id: string; db_id: string; title: string; done: number; props: string; position: number; created: string };

function toProperty(r: PropRow): Property {
  return { ...r, options: r.options ? (JSON.parse(r.options) as string[]) : null };
}

function toTask(r: TaskRow): Task {
  return { ...r, done: r.done === 1, props: JSON.parse(r.props) as Record<string, unknown> };
}

/* ---------- databases ---------- */

export function listDatabases(userId: string) {
  return getDb()
    .prepare('SELECT * FROM databases WHERE user_id = ? ORDER BY created DESC')
    .all(userId) as { id: string; user_id: string; name: string; created: string }[];
}

/**
 * Every read of a database goes through here, and it always takes the user id.
 * There is deliberately no "get by id" that skips the ownership check, so a
 * crafted request carrying someone else's database id cannot reach data.
 */
export function getDatabase(userId: string, dbId: string) {
  return getDb().prepare('SELECT * FROM databases WHERE id = ? AND user_id = ?').get(dbId, userId) as
    | { id: string; user_id: string; name: string; created: string }
    | undefined;
}

export function createDatabase(userId: string, name: string) {
  const id = newId();
  getDb()
    .prepare('INSERT INTO databases (id, user_id, name, created) VALUES (?, ?, ?, ?)')
    .run(id, userId, name, nowIso());
  return { id, user_id: userId, name, created: nowIso() };
}

export function renameDatabase(userId: string, dbId: string, name: string): boolean {
  const r = getDb().prepare('UPDATE databases SET name = ? WHERE id = ? AND user_id = ?').run(name, dbId, userId);
  return r.changes > 0;
}

export function deleteDatabase(userId: string, dbId: string): boolean {
  const r = getDb().prepare('DELETE FROM databases WHERE id = ? AND user_id = ?').run(dbId, userId);
  return r.changes > 0;
}

/* ---------- properties ---------- */

export function listProperties(dbId: string): Property[] {
  return (
    getDb().prepare('SELECT * FROM properties WHERE db_id = ? ORDER BY position, name').all(dbId) as PropRow[]
  ).map(toProperty);
}

export function createProperty(dbId: string, name: string, type: PropType, options: string[] | null): Property {
  const id = newId();
  const next = getDb().prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM properties WHERE db_id = ?').get(dbId) as { p: number };
  getDb()
    .prepare('INSERT INTO properties (id, db_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, dbId, name, type, options ? JSON.stringify(options) : null, next.p);
  return { id, db_id: dbId, name, type, options, position: next.p };
}

/** Returns the property with its owning database, or undefined if not the user's. */
export function getPropertyOwned(userId: string, propId: string) {
  const row = getDb()
    .prepare(
      `SELECT p.* FROM properties p
         JOIN databases d ON d.id = p.db_id
        WHERE p.id = ? AND d.user_id = ?`
    )
    .get(propId, userId) as PropRow | undefined;
  return row ? toProperty(row) : undefined;
}

/**
 * Renames a property and optionally replaces its select options.
 *
 * Removing an option that tasks already use would leave those values orphaned:
 * the stored string no longer matches any option, so the dropdown renders blank
 * and the value is invisible but still in the database. So any value that is no
 * longer valid gets cleared here, in the same transaction, and the count is
 * returned so the UI can tell the user how many tasks were affected.
 */
export function updateProperty(
  propId: string,
  dbId: string,
  name: string,
  options: string[] | null
): { cleared: number } {
  const db = getDb();
  const runSql = db.exec.bind(db);
  runSql('BEGIN');
  try {
    db.prepare('UPDATE properties SET name = ?, options = ? WHERE id = ?').run(
      name,
      options ? JSON.stringify(options) : null,
      propId
    );

    let cleared = 0;
    if (options) {
      const valid = new Set(options);
      const rows = db.prepare('SELECT id, props FROM tasks WHERE db_id = ?').all(dbId) as { id: string; props: string }[];
      const upd = db.prepare('UPDATE tasks SET props = ? WHERE id = ?');
      for (const r of rows) {
        const p = JSON.parse(r.props) as Record<string, unknown>;
        const v = p[propId];
        if (typeof v === 'string' && !valid.has(v)) {
          delete p[propId];
          upd.run(JSON.stringify(p), r.id);
          cleared += 1;
        }
      }
    }

    runSql('COMMIT');
    return { cleared };
  } catch (e) {
    runSql('ROLLBACK');
    throw e;
  }
}

/**
 * Deletes a property and strips its key from every task's props JSON.
 * Both happen in one transaction: a half-applied delete would leave orphaned
 * values keyed by a property that no longer exists.
 */
export function deleteProperty(propId: string, dbId: string): void {
  const db = getDb();
  const runSql = db.exec.bind(db);
  runSql('BEGIN');
  try {
    db.prepare('DELETE FROM properties WHERE id = ?').run(propId);
    const rows = db.prepare('SELECT id, props FROM tasks WHERE db_id = ?').all(dbId) as { id: string; props: string }[];
    const upd = db.prepare('UPDATE tasks SET props = ? WHERE id = ?');
    for (const r of rows) {
      const p = JSON.parse(r.props) as Record<string, unknown>;
      if (propId in p) {
        delete p[propId];
        upd.run(JSON.stringify(p), r.id);
      }
    }
    runSql('COMMIT');
  } catch (e) {
    runSql('ROLLBACK');
    throw e;
  }
}

/* ---------- tasks ---------- */

export function listTasks(dbId: string): Task[] {
  return (
    getDb().prepare('SELECT * FROM tasks WHERE db_id = ? ORDER BY position, created').all(dbId) as TaskRow[]
  ).map(toTask);
}

export function createTask(dbId: string, title: string, props: Record<string, unknown> = {}): Task {
  const id = newId();
  const created = nowIso();
  const next = getDb().prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM tasks WHERE db_id = ?').get(dbId) as { p: number };
  getDb()
    .prepare('INSERT INTO tasks (id, db_id, title, done, props, position, created) VALUES (?, ?, ?, 0, ?, ?, ?)')
    .run(id, dbId, title, JSON.stringify(props), next.p, created);
  return { id, db_id: dbId, title, done: false, props, position: next.p, created };
}

export function getTaskOwned(userId: string, taskId: string): Task | undefined {
  const row = getDb()
    .prepare(
      `SELECT t.* FROM tasks t
         JOIN databases d ON d.id = t.db_id
        WHERE t.id = ? AND d.user_id = ?`
    )
    .get(taskId, userId) as TaskRow | undefined;
  return row ? toTask(row) : undefined;
}

export function updateTask(
  taskId: string,
  patch: { title?: string; done?: boolean; props?: Record<string, unknown>; position?: number }
): void {
  const db = getDb();
  if (patch.title !== undefined) db.prepare('UPDATE tasks SET title = ? WHERE id = ?').run(patch.title, taskId);
  if (patch.done !== undefined) db.prepare('UPDATE tasks SET done = ? WHERE id = ?').run(patch.done ? 1 : 0, taskId);
  if (patch.position !== undefined) db.prepare('UPDATE tasks SET position = ? WHERE id = ?').run(patch.position, taskId);
  if (patch.props !== undefined) {
    // Merge rather than replace, so a patch touching one property does not wipe
    // the others. An explicit null clears a single value.
    const cur = db.prepare('SELECT props FROM tasks WHERE id = ?').get(taskId) as { props: string } | undefined;
    const merged = { ...(cur ? JSON.parse(cur.props) : {}), ...patch.props };
    for (const k of Object.keys(merged)) if (merged[k] === null) delete merged[k];
    db.prepare('UPDATE tasks SET props = ? WHERE id = ?').run(JSON.stringify(merged), taskId);
  }
}

export function deleteTask(taskId: string): void {
  getDb().prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
}
