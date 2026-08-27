'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DatabaseIcon, PlusIcon, ChevronIcon } from './Icons';

type Db = { id: string; name: string };

/**
 * Obsidian-style file tree sidebar: a collapsible section header, flat list of
 * databases below it, and a profile row pinned to the bottom whose menu opens
 * upward.
 */
export default function Sidebar({ databases, activeId, email }: { databases: Db[]; activeId?: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [menu, setMenu] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Click-outside and Escape both close the menu. Without these it can only be
  // dismissed by clicking the trigger again, which feels broken.
  useEffect(() => {
    if (!menu) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenu(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

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

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
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
                <Link href={`/db/${d.id}`} className={`sb-item ${d.id === activeId ? 'is-active' : ''}`}>
                  <span className="sb-item-icon">
                    <DatabaseIcon width={12} height={12} />
                  </span>
                  {d.name}
                </Link>
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

      <div className="sb-footer" ref={menuRef}>
        {menu && (
          <div className="sb-menu" role="menu">
            <div className="sb-menu-email">{email}</div>
            <button className="sb-menu-item" role="menuitem" onClick={signOut}>
              Sign out
            </button>
          </div>
        )}

        <button
          className="sb-profile"
          onClick={() => setMenu((m) => !m)}
          aria-haspopup="menu"
          aria-expanded={menu}
        >
          <span className="sb-avatar">{email[0]?.toUpperCase() ?? '?'}</span>
          <span className="sb-profile-name">{email.split('@')[0]}</span>
        </button>
      </div>
    </aside>
  );
}
