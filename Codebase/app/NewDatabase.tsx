'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewDatabase() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const res = await fetch('/api/databases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });

    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.message ?? 'Could not create the database.');
      return;
    }

    const db = await res.json();
    setName('');
    setError('');
    router.push(`/db/${db.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 12 }}>
      <input
        type="text"
        aria-label="New database name"
        placeholder="New database"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: '100%' }}
      />
      <button type="submit">Create</button>
      {error && (
        <p role="alert" style={{ color: '#b00', fontSize: 12 }}>
          {error}
        </p>
      )}
    </form>
  );
}
