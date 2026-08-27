'use client';

import { useState } from 'react';
import type { Property, Task } from '@/lib/props';
import PropCell from './PropCell';
import PropertyHeader from './PropertyHeader';

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
}: {
  dbId: string;
  properties: Property[];
  tasks: Task[];
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
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...body, props: { ...t.props, ...body.props } } : t)));
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
        <p role="alert" style={{ color: '#b00' }}>
          {error}
        </p>
      )}

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={th}>Done</th>
            <th style={th}>Title</th>
            {properties.map((p) => (
              <th key={p.id} style={th}>
                <PropertyHeader prop={p} />
              </th>
            ))}
            <th style={th} />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td style={td}>
                <input
                  type="checkbox"
                  aria-label={`Mark ${task.title} complete`}
                  checked={task.done}
                  onChange={(e) => patch(task, { done: e.target.checked })}
                />
              </td>
              <td style={td}>
                <input
                  type="text"
                  aria-label="Title"
                  value={task.title}
                  style={{ textDecoration: task.done ? 'line-through' : 'none', width: '100%' }}
                  onChange={(e) => setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, title: e.target.value } : t)))}
                  onBlur={(e) => patch(task, { title: e.target.value })}
                />
              </td>
              {properties.map((p) => (
                <td key={p.id} style={td}>
                  <PropCell prop={p} value={task.props[p.id]} onChange={(v) => patch(task, { props: { [p.id]: v } })} />
                </td>
              ))}
              <td style={td}>
                <button type="button" onClick={() => remove(task)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {tasks.length === 0 && (
            <tr>
              <td style={td} colSpan={properties.length + 3}>
                No tasks yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <form onSubmit={addTask} style={{ marginTop: 12 }}>
        <input
          type="text"
          aria-label="New task title"
          placeholder="New task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}

const th: React.CSSProperties = { border: '1px solid #ddd', padding: 6, textAlign: 'left', background: '#fafafa' };
const td: React.CSSProperties = { border: '1px solid #ddd', padding: 6 };
