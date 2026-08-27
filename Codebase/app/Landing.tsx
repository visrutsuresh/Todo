'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Obsidian's empty-pane landing: no database is loaded, just the actions you
 * would take next, centred and unstyled apart from hover.
 */
export default function Landing({ hasDatabases, firstId }: { hasDatabases: boolean; firstId?: string }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const res = await fetch('/api/databases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!res.ok) return;
    const db = await res.json();
    router.push(`/db/${db.id}`);
    router.refresh();
  }

  return (
    <main className="landing">
      {adding ? (
        <form onSubmit={create} style={{ width: 260 }}>
          <input
            className="field"
            autoFocus
            placeholder="Database name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => !name && setAdding(false)}
          />
        </form>
      ) : (
        <div className="landing-actions">
          <button onClick={() => setAdding(true)}>Create new database</button>
          {hasDatabases && firstId && <button onClick={() => router.push(`/db/${firstId}`)}>Go to database</button>}
        </div>
      )}
    </main>
  );
}
