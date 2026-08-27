'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DatabaseIcon, PlusIcon, ChevronIcon, PencilIcon, TrashIcon } from './Icons';
import ConfirmDialog from './ConfirmDialog';

type Db = { id: string; name: string };

/**
 * Obsidian-style file tree: collapsible section, flat list of databases, and a
 * profile row pinned to the bottom whose menu opens upward.
 *
 * Rename is reachable two ways, matching Obsidian: double-click the item, or
 * right-click for the context menu.
 */
export default function Sidebar({
  databases,
  activeId,
  email,
}: {
  databases: Db[];
  activeId?: string;
  email: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [menu, setMenu] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [ctx, setCtx] = useState<{ db: Db; x: number; y: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Db | null>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  // Escape and click-outside dismiss both popovers. Without these they can only
  // be closed by re-clicking the trigger, which feels broken.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (footerRef.current && !footerRef.current.contains(e.target as Node)) setMenu(false);
      setCtx(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenu(false);
        setCtx(null);
        setRenaming(null);
      }
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

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
    setName('');
    setAdding(false);
    router.push(`/db/${db.id}`);
    router.refresh();
  }

  function startRename(db: Db) {
    setCtx(null);
    setRenameText(db.name);
    setRenaming(db.id);
  }

  async function commitRename(id: string) {
    const trimmed = renameText.trim();
    setRenaming(null);
    if (!trimmed) return;
    await fetch(`/api/databases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    router.refresh();
  }

  async function doDelete(db: Db) {
    setConfirmDelete(null);
    await fetch(`/api/databases/${db.id}`, { method: 'DELETE' });
    // If the open database was the one deleted, the current route is now gone.
    if (db.id === activeId) router.push('/');
    router.refresh();
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sb-toolbar">
          <button className="btn btn-ghost btn-icon" title="New database" onClick={() => setAdding((a) => !a)}>
            <PlusIcon />
          </button>
        </div>

        <nav className="sb-tree">
          <button className="sb-section" onClick={() => setOpen((o) => !o)}>
            <span className={`sb-caret ${open ? 'is-open' : ''}`}>
              <ChevronIcon width={11} height={11} />
            </span>
            Databases
          </button>

          {open && (
            <ul className="sb-list">
              {databases.map((d) => (
                <li key={d.id}>
                  {renaming === d.id ? (
                    <input
                      className="sb-rename"
                      autoFocus
                      value={renameText}
                      onChange={(e) => setRenameText(e.target.value)}
                      onBlur={() => commitRename(d.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(d.id);
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                    />
                  ) : (
                    <Link
                      href={`/db/${d.id}`}
                      className={`sb-item ${d.id === activeId ? 'is-active' : ''}`}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        startRename(d);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setCtx({ db: d, x: e.clientX, y: e.clientY });
                      }}
                    >
                      <span className="sb-item-icon">
                        <DatabaseIcon width={13} height={13} />
                      </span>
                      {d.name}
                    </Link>
                  )}
                </li>
              ))}
              {databases.length === 0 && <li className="sb-empty">No databases</li>}
            </ul>
          )}

          {adding && (
            <form onSubmit={create} className="sb-add">
              <input
                className="field"
                autoFocus
                placeholder="Database name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => !name && setAdding(false)}
              />
            </form>
          )}
        </nav>

        <div className="sb-footer" ref={footerRef}>
          {menu && (
            <div className="sb-menu" role="menu">
              <div className="sb-menu-email">{email}</div>
              <button className="sb-menu-item" role="menuitem" onClick={signOut}>
                Sign out
              </button>
            </div>
          )}

          <button className="sb-profile" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu}>
            <span className="sb-avatar">{email[0]?.toUpperCase() ?? '?'}</span>
            <span className="sb-profile-name">{email.split('@')[0]}</span>
          </button>
        </div>
      </aside>

      {ctx && (
        <div
          className="ctx"
          style={{ left: ctx.x, top: ctx.y }}
          role="menu"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button role="menuitem" onClick={() => startRename(ctx.db)}>
            <PencilIcon width={13} height={13} />
            Rename
          </button>
          <button
            role="menuitem"
            className="is-danger"
            onClick={() => {
              setConfirmDelete(ctx.db);
              setCtx(null);
            }}
          >
            <TrashIcon width={13} height={13} />
            Delete
          </button>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${confirmDelete.name}"?`}
          body="Every task and property in this database is deleted permanently. This cannot be undone."
          onConfirm={() => doDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
