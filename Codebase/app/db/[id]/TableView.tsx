'use client';

import { useState, useRef, useEffect } from 'react';
import type { Property, Task } from '@/lib/props';
import PropCell from './PropCell';
import PropertyHeader from './PropertyHeader';
import AddProperty from './AddProperty';
import { CloseIcon, PlusIcon } from '../../Icons';
import SystemHeader from './SystemHeader';

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.message ?? 'Request failed.');
  }
  return res.json();
}

export default function TableView({
  dbId,
  properties,
  tasks: initial,
  newTaskRef,
  onHide,
  onSort,
  titleLabel,
  doneLabel,
  emptyColumns,
}: {
  dbId: string;
  properties: Property[];
  tasks: Task[];
  /** ViewSwitcher's New button calls through this to create a row. */
  newTaskRef?: React.MutableRefObject<(() => void) | null>;
  onHide?: (id: string) => void;
  onSort?: (id: string, dir: 'asc' | 'desc') => void;
  titleLabel: string;
  doneLabel: string;
  emptyColumns: Record<string, boolean>;
}) {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [error, setError] = useState('');
  // The row to focus after creation. Cleared once focused so a re-render does
  // not steal the cursor back while the user is typing somewhere else.
  const [focusId, setFocusId] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  function fail(e: unknown) {
    setError(e instanceof Error ? e.message : 'Something went wrong.');
  }

  // Creates the row immediately with a placeholder, then focuses and SELECTS
  // it, so the first keystroke replaces the placeholder instead of appending
  // to it. Creating first (rather than collecting a title then posting) means
  // the row is real straight away and every property cell is usable.
  async function addTask() {
    try {
      const created = (await api(`/api/databases/${dbId}/tasks`, 'POST', { title: 'task' })) as Task;
      setTasks((prev) => [...prev, created]);
      setFocusId(created.id);
      setError('');
    } catch (e) {
      fail(e);
    }
  }

  useEffect(() => {
    if (!focusId) return;
    const el = inputs.current[focusId];
    if (el) {
      el.focus();
      el.select();
    }
    setFocusId(null);
  }, [focusId]);

  useEffect(() => {
    if (!newTaskRef) return;
    newTaskRef.current = addTask;
    return () => {
      newTaskRef.current = null;
    };
  });

  // Optimistic: update the row immediately, roll back if the server rejects.
  // Without the rollback a value the server refused would stay on screen and
  // silently disagree with the database.
  async function patch(task: Task, body: Partial<Task> & { props?: Record<string, unknown> }) {
    const before = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, ...body, props: { ...t.props, ...body.props } } : t))
    );
    try {
      await api(`/api/tasks/${task.id}`, 'PATCH', body);
      setError('');
    } catch (e) {
      setTasks(before);
      fail(e);
    }
  }

  async function remove(task: Task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    const before = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await api(`/api/tasks/${task.id}`, 'DELETE');
    } catch (e) {
      setTasks(before);
      fail(e);
    }
  }

  return (
    <div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <table className="ntable">
        <thead>
          <tr>
            <th style={{ width: 110 }}>
              <SystemHeader dbId={dbId} which="done" label={doneLabel} />
            </th>
            <th style={{ minWidth: 260 }}>
              <SystemHeader dbId={dbId} which="title" label={titleLabel} />
            </th>
            {properties.map((p) => (
              <th key={p.id} style={{ minWidth: 150 }}>
                <PropertyHeader prop={p} columnEmpty={emptyColumns[p.id] ?? true} onHide={onHide} onSort={onSort} />
              </th>
            ))}
            <th className="col-add">
              <AddProperty dbId={dbId} />
            </th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Mark ${task.title} complete`}
                  checked={task.done}
                  onChange={(e) => patch(task, { done: e.target.checked })}
                />
              </td>

              <td>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    ref={(el) => {
                      inputs.current[task.id] = el;
                    }}
                    className={`cell-input cell-title ${task.done ? 'is-done' : ''}`}
                    type="text"
                    aria-label="Title"
                    value={task.title}
                    onChange={(e) =>
                      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, title: e.target.value } : t)))
                    }
                    onBlur={(e) => patch(task, { title: e.target.value })}
                  />
                  <span className="row-actions">
                    <button
                      className="btn btn-ghost btn-icon"
                      title="Delete task"
                      aria-label={`Delete ${task.title}`}
                      onClick={() => remove(task)}
                    >
                      <CloseIcon />
                    </button>
                  </span>
                </div>
              </td>

              {properties.map((p) => (
                <td key={p.id}>
                  <PropCell prop={p} value={task.props[p.id]} onChange={(v) => patch(task, { props: { [p.id]: v } })} />
                </td>
              ))}

              <td className="col-add" />
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" className="add-row" onClick={addTask}>
        <span className="icon">
          <PlusIcon />
        </span>
        New task
      </button>
    </div>
  );
}
