'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROP_TYPES, type PropType } from '@/lib/props';

export default function AddProperty({ dbId }: { dbId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<PropType>('text');
  const [optionsText, setOptionsText] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body: { name: string; type: PropType; options?: string[] } = { name, type };
    if (type === 'select') {
      body.options = optionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const res = await fetch(`/api/databases/${dbId}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.message ?? 'Could not add the property.');
      return;
    }

    setName('');
    setOptionsText('');
    setType('text');
    setError('');
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}>
        Add property
      </button>
    );
  }

  return (
    <form onSubmit={submit} style={{ border: '1px solid #ddd', padding: 12, marginTop: 8 }}>
      <input
        type="text"
        aria-label="Property name"
        placeholder="Property name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <select aria-label="Property type" value={type} onChange={(e) => setType(e.target.value as PropType)}>
        {PROP_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {type === 'select' && (
        <input
          type="text"
          aria-label="Options, comma separated"
          placeholder="Options, comma separated"
          required
          value={optionsText}
          onChange={(e) => setOptionsText(e.target.value)}
        />
      )}

      <button type="submit">Create</button>
      <button type="button" onClick={() => setOpen(false)}>
        Cancel
      </button>

      {error && (
        <p role="alert" style={{ color: '#b00' }}>
          {error}
        </p>
      )}
    </form>
  );
}
