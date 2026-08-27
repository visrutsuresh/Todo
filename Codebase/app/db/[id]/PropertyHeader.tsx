'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Property } from '@/lib/props';
import { TYPE_ICON, MoreIcon, CloseIcon } from '../../Icons';

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
      <div className="col-head">
        <span className="col-icon">{(() => { const I = TYPE_ICON[prop.type]; return <I />; })()}</span>
        <span>{prop.name}</span>
        <span className="col-actions">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title={`Edit ${prop.name}`}
            aria-label={`Edit ${prop.name}`}
            onClick={() => setEditing(true)}
          >
            <MoreIcon />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            title={`Delete ${prop.name}`}
            aria-label={`Delete ${prop.name}`}
            onClick={remove}
          >
            <CloseIcon />
          </button>
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={save} style={{ padding: '6px 0' }}>
      <input
        className="field"
        style={{ height: 26, marginBottom: 4 }}
        type="text"
        aria-label={`Rename ${prop.name}`}
        autoFocus
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {prop.type === 'select' && (
        <input
          className="field"
          style={{ height: 26, marginBottom: 4 }}
          type="text"
          aria-label={`Options for ${prop.name}`}
          placeholder="Options, comma separated"
          required
          value={optionsText}
          onChange={(e) => setOptionsText(e.target.value)}
        />
      )}

      <button type="submit" className="btn btn-sm btn-primary" disabled={busy}>
        Save
      </button>{' '}
      <button type="button" className="btn btn-sm" onClick={cancel} disabled={busy}>
        Cancel
      </button>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </form>
  );
}
