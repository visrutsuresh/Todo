'use client';

import { useState } from 'react';
import type { Property, Task } from '@/lib/props';

const UNSET = '__unset__';

/**
 * Kanban over any select property. Columns are that property's options, plus a
 * leading column for tasks with no value.
 *
 * ponytail: native HTML5 drag and drop. A drag-and-drop library would be the
 * single largest dependency in the project for one interaction that the
 * platform already implements. Known ceiling: HTML5 DnD has no touch support,
 * so this is pointer-only. A tap-to-move fallback is the upgrade path.
 */
export default function BoardView({
  properties,
  tasks: initial,
  groupBy,
  onGroupByChange,
}: {
  properties: Property[];
  tasks: Task[];
  groupBy: string;
  onGroupByChange: (id: string) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [error, setError] = useState('');

  const selects = properties.filter((p) => p.type === 'select');
  const prop = selects.find((p) => p.id === groupBy) ?? selects[0];

  if (selects.length === 0) {
    return (
      <div className="notice">
        <p style={{ margin: 0, color: 'var(--fg)' }}>The board needs a select property to group by.</p>
        <p style={{ margin: '6px 0 0' }}>
          Add one from the table view, for example a Status with options Todo, Doing and Done.
        </p>
      </div>
    );
  }

  const columns = [UNSET, ...(prop.options ?? [])];

  async function move(taskId: string, to: string) {
    const value = to === UNSET ? null : to;
    const before = tasks;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const props = { ...t.props };
        if (value === null) delete props[prop.id];
        else props[prop.id] = value;
        return { ...t, props };
      })
    );

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ props: { [prop.id]: value } }),
    });

    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setTasks(before);
      setError(b.message ?? 'Could not move that task.');
    } else {
      setError('');
    }
  }

  return (
    <div>
      <label className="muted" style={{ fontSize: 12 }}>
        Group by{' '}
        <select
          className="field"
          style={{ height: 26, width: 'auto', display: 'inline-block' }}
          value={prop.id}
          onChange={(e) => onGroupByChange(e.target.value)}
        >
          {selects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <div className="board">
        {columns.map((col) => {
          const inCol = tasks.filter((t) => {
            const v = t.props[prop.id];
            return col === UNSET ? v === undefined || v === null : v === col;
          });

          return (
            <div
              key={col}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(col);
              }}
              onDragLeave={() => setOver((c) => (c === col ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                if (dragging) move(dragging, col);
                setDragging(null);
              }}
              className={`board-col ${over === col ? 'is-over' : ''}`}
            >
              <h3 className="board-col-head">
                {col === UNSET ? <span className="muted">No value</span> : <span className="pill">{col}</span>}
                <span className="board-count">{inCol.length}</span>
              </h3>

              {inCol.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDragging(t.id)}
                  onDragEnd={() => setDragging(null)}
                  className={`card ${dragging === t.id ? 'is-dragging' : ''} ${t.done ? 'is-done' : ''}`}
                >
                  {t.title}
                </div>
              ))}

              {inCol.length === 0 && <p className="board-empty">Empty</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
