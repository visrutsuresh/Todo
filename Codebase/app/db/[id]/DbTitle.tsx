'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DatabaseIcon } from '../../Icons';
import { useDismiss } from '../../useDismiss';

/** Double-click to rename, matching the sidebar. Enter commits, Escape aborts. */
export default function DbTitle({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(name);
  const wrapRef = useRef<HTMLHeadingElement>(null);

  const cancel = useCallback(() => {
    setText(name);
    setEditing(false);
  }, [name]);

  useDismiss(editing, cancel, [wrapRef]);

  async function commit() {
    const trimmed = text.trim();
    setEditing(false);
    if (!trimmed || trimmed === name) {
      setText(name);
      return;
    }
    const res = await fetch(`/api/databases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!res.ok) setText(name);
    router.refresh();
  }

  return (
    <h1 className="db-title" ref={wrapRef}>
      <span className="db-title-icon">
        <DatabaseIcon width={26} height={26} />
      </span>

      {editing ? (
        <input
          className="db-title-input"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          // Click-away cancels rather than commits, matching the sidebar.
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setText(name);
              setEditing(false);
            }
          }}
        />
      ) : (
        <span onDoubleClick={() => setEditing(true)} title="Double-click to rename">
          {name}
        </span>
      )}
    </h1>
  );
}
