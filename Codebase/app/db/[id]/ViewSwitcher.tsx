'use client';

import { useState, useMemo, useRef } from 'react';
import { compareValues, type Property, type Task } from '@/lib/props';
import TableView from './TableView';
import BoardView from './BoardView';
import ViewSettings from './ViewSettings';
import { TableIcon, BoardIcon, SettingsIcon, SortIcon } from '../../Icons';

export type ViewName = 'table' | 'board';
export type SortState = { propId: string | null; dir: 'asc' | 'desc' };

const TABS: { id: ViewName; label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'table', label: 'Table', Icon: TableIcon },
  { id: 'board', label: 'Board', Icon: BoardIcon },
];

export default function ViewSwitcher({
  dbId,
  properties,
  tasks,
}: {
  dbId: string;
  properties: Property[];
  tasks: Task[];
}) {
  const [view, setView] = useState<ViewName>('table');
  const [groupBy, setGroupBy] = useState<string>(properties.find((p) => p.type === 'select')?.id ?? '');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState>({ propId: null, dir: 'asc' });
  const [settings, setSettings] = useState(false);
  const addRowRef = useRef<HTMLInputElement>(null);

  const visible = properties.filter((p) => !hidden.has(p.id));

  // Sorting happens here rather than in SQL because property values live in a
  // JSON column, so the database cannot order by them. Fine at this scale, and
  // the trade-off is written down in the PRD.
  const sorted = useMemo(() => {
    if (!sort.propId) return tasks;
    const dir = sort.dir === 'asc' ? 1 : -1;
    const prop = properties.find((p) => p.id === sort.propId);

    return [...tasks].sort((a, b) => {
      if (sort.propId === '__title__') return a.title.localeCompare(b.title) * dir;
      if (sort.propId === '__done__') return (Number(a.done) - Number(b.done)) * dir;
      if (!prop) return 0;
      return compareValues(prop.type, a.props[prop.id], b.props[prop.id]) * dir;
    });
  }, [tasks, sort, properties]);

  // Re-key on the visible property set so a deleted or hidden property cannot
  // linger in a view's client state.
  const schemaKey = visible.map((p) => p.id).join(',');

  function toggleHidden(id: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="db-bar">
        <nav className="view-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              aria-current={view === t.id ? 'page' : undefined}
              className={`view-tab ${view === t.id ? 'is-active' : ''}`}
            >
              <span className="col-icon">
                <t.Icon />
              </span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="db-tools">
          <button
            className={`tool ${sort.propId ? 'is-active' : ''}`}
            title="Sort"
            aria-label="Sort"
            onClick={() => setSettings(true)}
          >
            <SortIcon />
          </button>
          <button
            className={`tool ${settings ? 'is-active' : ''}`}
            title="View settings"
            aria-label="View settings"
            aria-expanded={settings}
            onClick={() => setSettings((s) => !s)}
          >
            <SettingsIcon />
          </button>
          <button className="btn btn-new" onClick={() => addRowRef.current?.focus()}>
            New
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <TableView key={schemaKey} dbId={dbId} properties={visible} tasks={sorted} addRowRef={addRowRef} />
      ) : (
        <BoardView
          key={schemaKey}
          properties={visible}
          tasks={sorted}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
        />
      )}

      {settings && (
        <ViewSettings
          view={view}
          onView={setView}
          properties={properties}
          hidden={hidden}
          onToggleHidden={toggleHidden}
          sort={sort}
          onSort={setSort}
          onClose={() => setSettings(false)}
        />
      )}
    </div>
  );
}
