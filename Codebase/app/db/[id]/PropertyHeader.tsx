'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Property } from '@/lib/props';
import { TYPE_ICON, SortIcon, TrashIcon, SettingsIcon, EyeOffIcon, ChevronIcon } from '../../Icons';
import ConfirmDialog from '../../ConfirmDialog';

/**
 * Notion's column-header menu. The whole header is the trigger, so there are no
 * hover-revealed icon buttons: clicking the column name opens everything.
 *
 * Only actions with a feature behind them are listed. Change type is absent
 * because the PRD rules it out (values would be stranded in the old shape), and
 * Filter, Group, Calculate and AI Autofill are absent because they do not exist.
 */
export default function PropertyHeader({
  prop,
  onHide,
  onSort,
}: {
  prop: Property;
  onHide?: (id: string) => void;
  onSort?: (id: string, dir: 'asc' | 'desc') => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(prop.name);
  const [optionsText, setOptionsText] = useState(prop.options?.join(', ') ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (popRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setEditing(false);
    setError('');
    setName(prop.name);
    setOptionsText(prop.options?.join(', ') ?? '');
  }

  function toggle() {
    if (open) return close();
    const r = btnRef.current?.getBoundingClientRect();
    // Anchored to the header and clamped to the viewport, so a column near the
    // right edge does not open a menu that runs off screen. The old inline
    // editor lived inside the <th> and overflowed the table instead.
    if (r) setPos({ x: Math.min(r.left, window.innerWidth - 250), y: r.bottom + 4 });
    setOpen(true);
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
    if (cleared > 0) alert(`Cleared that value from ${cleared} task${cleared === 1 ? '' : 's'}.`);

    setBusy(false);
    close();
    router.refresh();
  }

  async function remove() {
    setConfirming(false);
    close();
    await fetch(`/api/properties/${prop.id}`, { method: 'DELETE' });
    router.refresh();
  }

  const Icon = TYPE_ICON[prop.type];

  return (
    <>
      <button ref={btnRef} className="col-head col-trigger" onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
        <span className="col-icon">
          <Icon />
        </span>
        <span>{prop.name}</span>
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
              aria-label={`Rename ${prop.name}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && close()}
            />
          </form>

          {error && (
            <p className="error" style={{ padding: '0 4px' }}>
              {error}
            </p>
          )}

          <button className="pop-item" onClick={() => setEditing((v) => !v)} role="menuitem">
            <SettingsIcon width={14} height={14} />
            Edit property
            <span className={`pop-caret ${editing ? 'is-open' : ''}`}>
              <ChevronIcon width={12} height={12} />
            </span>
          </button>

          {editing && (
            <div className="pop-sub">
              <p className="panel-label">Type</p>
              <p className="pop-type">
                {prop.type}
                <span className="subtle"> (cannot be changed)</span>
              </p>

              {prop.type === 'select' && (
                <>
                  <p className="panel-label">Options</p>
                  <input
                    className="field"
                    aria-label={`Options for ${prop.name}`}
                    placeholder="Comma separated"
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                  />
                </>
              )}

              <button className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={save} disabled={busy}>
                Save
              </button>
            </div>
          )}

          <div className="pop-sep" />

          <button
            className="pop-item"
            onClick={() => {
              onSort?.(prop.id, 'asc');
              close();
            }}
            role="menuitem"
          >
            <SortIcon width={14} height={14} />
            Sort ascending
          </button>
          <button
            className="pop-item"
            onClick={() => {
              onSort?.(prop.id, 'desc');
              close();
            }}
            role="menuitem"
          >
            <SortIcon width={14} height={14} />
            Sort descending
          </button>
          <button
            className="pop-item"
            onClick={() => {
              onHide?.(prop.id);
              close();
            }}
            role="menuitem"
          >
            <EyeOffIcon width={14} height={14} />
            Hide in view
          </button>

          <div className="pop-sep" />

          <button className="pop-item is-danger" onClick={() => setConfirming(true)} role="menuitem">
            <TrashIcon width={14} height={14} />
            Delete property
          </button>
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title={`Delete "${prop.name}"?`}
          body="This property and its value on every task in this database are deleted permanently. This cannot be undone."
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
