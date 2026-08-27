'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PROP_TYPES, type PropType } from '@/lib/props';
import { PlusIcon, TYPE_ICON } from '../../Icons';
import { useDismiss } from '../../useDismiss';

/**
 * Add-property form as an anchored popover.
 *
 * It used to render inline inside the <th>, which meant the last column's form
 * overflowed off the right edge of the screen. Same shape of bug as the old
 * property editor: a popover does not belong inside the cell it anchors to.
 */
export default function AddProperty({ dbId }: { dbId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<PropType>('text');
  const [optionsText, setOptionsText] = useState('');
  const [error, setError] = useState('');
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setName('');
    setType('text');
    setOptionsText('');
    setError('');
  }, []);

  useDismiss(open, close, [popRef, btnRef]);

  function toggle() {
    if (open) return close();
    const r = btnRef.current?.getBoundingClientRect();
    // Clamped so the last column's form cannot open off the right edge.
    if (r) setPos({ x: Math.min(r.left, window.innerWidth - 250), y: r.bottom + 4 });
    setOpen(true);
  }

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

    close();
    router.refresh();
  }

  const Icon = TYPE_ICON[type];

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="btn btn-ghost btn-icon"
        title="Add property"
        aria-label="Add property"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <PlusIcon />
      </button>

      {open && (
        <div ref={popRef} className="pop" style={{ left: pos.x, top: pos.y }}>
          <form onSubmit={submit}>
            <div className="pop-name">
              <span className="pop-name-icon">
                <Icon />
              </span>
              <input
                className="field"
                type="text"
                aria-label="Property name"
                placeholder="Property name"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="pop-sub" style={{ paddingTop: 0 }}>
              <p className="panel-label">Type</p>
              <select
                className="field"
                aria-label="Property type"
                value={type}
                onChange={(e) => setType(e.target.value as PropType)}
              >
                {PROP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {type === 'select' && (
                <>
                  <p className="panel-label" style={{ marginTop: 8 }}>
                    Options
                  </p>
                  <input
                    className="field"
                    type="text"
                    aria-label="Options, comma separated"
                    placeholder="Comma separated"
                    required
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                  />
                </>
              )}

              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}

              <div style={{ marginTop: 10 }}>
                <button type="submit" className="btn btn-sm btn-primary">
                  Create
                </button>{' '}
                <button type="button" className="btn btn-sm" onClick={close}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
