'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Property } from '@/lib/props';

/**
 * One column header. Displays the property, and switches to an inline editor
 * for renaming and (for select) editing the option list.
 * ponytail: an inline form in the header rather than a modal. Same capability,
 * no overlay, no focus trap, no portal.
 */
export default function PropertyHeader({ prop }: { prop: Property }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(prop.name);
  const [optionsText, setOptionsText] = useState(prop.options?.join(', ') ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function cancel() {
    setName(prop.name);
    setOptionsText(prop.options?.join(', ') ?? '');
    setError('');
    setEditing(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const body: { name: string; options?: string[] } = { name };
    if (prop.type === 'select') {
      body.options = optionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // Warn before silently clearing values. The server does the clearing
      // either way, but the user should know it is about to happen.
      const removed = (prop.options ?? []).filter((o) => !body.options!.includes(o));
      if (removed.length > 0) {
        const ok = confirm(
          `Removing ${removed.map((r) => `"${r}"`).join(', ')} will clear that value from any task using it. Continue?`
        );
        if (!ok) {
          setBusy(false);
          return;
        }
      }
    }

    const res = await fetch(`/api/properties/${prop.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.message ?? 'Could not save.');
      setBusy(false);
      return;
    }

    const { cleared } = await res.json();
    if (cleared > 0) {
      alert(`Cleared that value from ${cleared} task${cleared === 1 ? '' : 's'}.`);
    }

    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    const ok = confirm(`Delete the "${prop.name}" property? Its values are removed from every task.`);
    if (!ok) return;
    await fetch(`/api/properties/${prop.id}`, { method: 'DELETE' });
    router.refresh();
  }

  if (!editing) {
    return (
      <div>
        <span>{prop.name}</span>{' '}
        <span style={{ fontWeight: 400, color: '#888' }}>({prop.type})</span>{' '}
        <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${prop.name}`}>
          Edit
        </button>{' '}
        <button type="button" onClick={remove} aria-label={`Delete ${prop.name}`}>
          x
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} style={{ fontWeight: 400 }}>
      <input
        type="text"
        aria-label={`Rename ${prop.name}`}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: '100%', marginBottom: 4 }}
      />

      {prop.type === 'select' && (
        <input
          type="text"
          aria-label={`Options for ${prop.name}`}
          placeholder="Options, comma separated"
          required
          value={optionsText}
          onChange={(e) => setOptionsText(e.target.value)}
          style={{ width: '100%', marginBottom: 4 }}
        />
      )}

      <button type="submit" disabled={busy}>
        Save
      </button>{' '}
      <button type="button" onClick={cancel} disabled={busy}>
        Cancel
      </button>

      {error && (
        <p role="alert" style={{ color: '#b00', fontSize: 12, margin: '4px 0 0' }}>
          {error}
        </p>
      )}
    </form>
  );
}
