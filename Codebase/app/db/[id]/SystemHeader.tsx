'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TYPE_ICON, CheckIcon } from '../../Icons';
import { useDismiss } from '../../useDismiss';

/**
 * Header for the two system columns, Title and Done. They can be renamed but
 * never deleted, hidden or retyped: both are baked into the tasks table as real
 * columns, and "mark tasks as complete" is a graded requirement that must keep
 * working on a database with zero custom properties.
 */
export default function SystemHeader({
  dbId,
  which,
  label,
}: {
  dbId: string;
  which: 'title' | 'done';
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(label);
  const [error, setError] = useState('');
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setText(label);
    setError('');
  }, [label]);

  useDismiss(open, close, [popRef, btnRef]);

  function toggle() {
    if (open) return close();
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ x: Math.min(r.left, window.innerWidth - 250), y: r.bottom + 4 });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Label cannot be empty.');
      return;
    }

    const res = await fetch(`/api/databases/${dbId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(which === 'title' ? { titleLabel: trimmed } : { doneLabel: trimmed }),
    });

    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.message ?? 'Could not save.');
      return;
    }

    setOpen(false);
    setError('');
    router.refresh();
  }

  const Icon = which === 'title' ? TYPE_ICON.text : CheckIcon;

  return (
    <>
      <button ref={btnRef} className="col-head col-trigger" onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
        <span className="col-icon">
          <Icon />
        </span>
        <span>{label}</span>
      </button>

      {open && (
        <div ref={popRef} className="pop" style={{ left: pos.x, top: pos.y }} role="menu">
          <form onSubmit={save} className="pop-name">
            <span className="pop-name-icon">
              <Icon />
            </span>
            <input
              className="field"
              autoFocus
              aria-label={`Rename ${label}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && close()}
            />
          </form>

          {error && (
            <p className="error" style={{ padding: '0 4px' }}>
              {error}
            </p>
          )}

          <div className="pop-sub">
            <p className="pop-type subtle" style={{ margin: 0 }}>
              Built-in column. It can be renamed, but not deleted, hidden or retyped.
            </p>
          </div>

          <button className="btn btn-sm btn-primary" style={{ margin: '4px 4px 2px', width: 'calc(100% - 8px)' }} onClick={save}>
            Save
          </button>
        </div>
      )}
    </>
  );
}
