'use client';

import type { Property } from '@/lib/props';
import { TYPE_ICON, TableIcon, BoardIcon, CloseIcon, LayoutIcon, EyeSmallIcon, SortIcon, CheckIcon } from '../../Icons';
import type { ViewName, SortState } from './ViewSwitcher';

/**
 * Notion's View settings drawer, cut down to the controls that actually DO
 * something here: layout, property visibility, and sort.
 *
 * Filter, Automations, AI Autofill and Conditional color are deliberately
 * absent rather than rendered as dead chrome. A menu that opens onto nothing
 * reads as broken, not as scoped.
 */
export default function ViewSettings({
  view,
  onView,
  properties,
  hidden,
  onToggleHidden,
  sort,
  onSort,
  onClose,
}: {
  view: ViewName;
  onView: (v: ViewName) => void;
  properties: Property[];
  hidden: Set<string>;
  onToggleHidden: (id: string) => void;
  sort: SortState;
  onSort: (s: SortState) => void;
  onClose: () => void;
}) {
  const visibleCount = properties.length - hidden.size;

  return (
    <aside className="panel" aria-label="View settings">
      <div className="panel-head">
        <span className="panel-title">View settings</span>
        <button className="tool" onClick={onClose} aria-label="Close view settings">
          <CloseIcon />
        </button>
      </div>

      <div className="panel-group">
        <p className="panel-label">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <LayoutIcon width={13} height={13} />
            Layout
          </span>
        </p>
        <div className="seg">
          <button className={view === 'table' ? 'is-active' : ''} onClick={() => onView('table')}>
            <TableIcon width={13} height={13} />
            Table
          </button>
          <button className={view === 'board' ? 'is-active' : ''} onClick={() => onView('board')}>
            <BoardIcon width={13} height={13} />
            Board
          </button>
        </div>
      </div>

      <div className="panel-group">
        <p className="panel-label">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <EyeSmallIcon width={13} height={13} />
            Property visibility
            <span className="spacer">{visibleCount}</span>
          </span>
        </p>

        {properties.length === 0 && <p className="subtle" style={{ padding: '0 8px' }}>No properties yet.</p>}

        {properties.map((p) => {
          const Icon = TYPE_ICON[p.type];
          return (
            <div key={p.id} className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={!hidden.has(p.id)}
                  onChange={() => onToggleHidden(p.id)}
                  aria-label={`Show ${p.name}`}
                />
                <span className="col-icon">
                  <Icon />
                </span>
                {p.name}
              </label>
            </div>
          );
        })}
      </div>

      <div className="panel-group">
        <p className="panel-label">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <SortIcon width={13} height={13} />
            Sort
          </span>
        </p>

        <select
          className="field"
          style={{ marginBottom: 6 }}
          aria-label="Sort by"
          value={sort.propId ?? ''}
          onChange={(e) => onSort({ ...sort, propId: e.target.value || null })}
        >
          <option value="">Manual order</option>
          <option value="__title__">Name</option>
          <option value="__done__">Done</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {sort.propId && (
          <div className="seg">
            <button className={sort.dir === 'asc' ? 'is-active' : ''} onClick={() => onSort({ ...sort, dir: 'asc' })}>
              Ascending
            </button>
            <button className={sort.dir === 'desc' ? 'is-active' : ''} onClick={() => onSort({ ...sort, dir: 'desc' })}>
              Descending
            </button>
          </div>
        )}
      </div>

      <div className="panel-group">
        <p className="panel-label">Data source</p>
        <button className="menu-item" disabled style={{ cursor: 'default' }}>
          <CheckIcon width={13} height={13} />
          <span className="muted">Local SQLite</span>
        </button>
      </div>
    </aside>
  );
}
