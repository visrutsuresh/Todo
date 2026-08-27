'use client';

import { useState } from 'react';
import type { Property, Task } from '@/lib/props';
import PropCell from './PropCell';
import PropertyHeader from './PropertyHeader';
import AddProperty from './AddProperty';
import { TYPE_ICON, CloseIcon, PlusIcon, CheckIcon } from '../../Icons';

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
  addRowRef,
}: {
  dbId: string;
  properties: Property[];
  tasks: Task[];
  addRowRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  function fail(e: unknown) {
    setError(e instanceof Error ? e.message : 'Something went wrong.');
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    try {
      const created = (await api(`/api/databases/${dbId}/tasks`, 'POST', { title: t })) as Task;
      setTasks((prev) => [...prev, created]);
      setTitle('');
      setError('');
    } catch (e) {
      fail(e);
    }
  }

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
            <th style={{ width: 92 }}>
              <div className="col-head">
                <span className="col-icon">
                  <CheckIcon />
                </span>
                Done
              </div>
            </th>
            <th style={{ minWidth: 260 }}>
              <div className="col-head">
                <span className="col-icon">{(() => { const I = TYPE_ICON.text; return <I />; })()}</span>
                Name
              </div>
            </th>
            {properties.map((p) => (
              <th key={p.id} style={{ minWidth: 150 }}>
                <PropertyHeader prop={p} />
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

              <td />
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={addTask} className="add-row">
        <span className="icon">
          <PlusIcon />
        </span>
        <input
          ref={addRowRef}
          type="text"
          aria-label="New task title"
          placeholder="New page"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </form>
    </div>
  );
}
