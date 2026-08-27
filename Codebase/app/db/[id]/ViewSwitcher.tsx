'use client';

import { useState, useMemo, useRef } from 'react';
import { compareValues, type Property, type Task } from '@/lib/props';
import TableView from './TableView';
import BoardView from './BoardView';
import ViewSettings from './ViewSettings';
import { SettingsIcon } from '../../Icons';

export type ViewName = 'table' | 'board';
export type SortState = { propId: string | null; dir: 'asc' | 'desc' };

export default function ViewSwitcher({
  dbId,
  properties,
  tasks,
  titleLabel,
  doneLabel,
  emptyColumns,
}: {
  dbId: string;
  properties: Property[];
  tasks: Task[];
  titleLabel: string;
  doneLabel: string;
  emptyColumns: Record<string, boolean>;
}) {
  const [view, setView] = useState<ViewName>('table');
  const [groupBy, setGroupBy] = useState<string>(properties.find((p) => p.type === 'select')?.id ?? '');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState>({ propId: null, dir: 'asc' });
  const [settings, setSettings] = useState(false);
  const newTaskRef = useRef<(() => void) | null>(null);

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
      {/* Layout now lives in the View settings panel, so the tab row is gone. */}
      <div className="db-bar db-bar-end">
        <div className="db-tools">
          <button
            className={`tool ${settings ? 'is-active' : ''}`}
            title="View settings"
            aria-label="View settings"
            aria-expanded={settings}
            onClick={() => setSettings((s) => !s)}
          >
            <SettingsIcon />
          </button>
          <button className="btn btn-new" onClick={() => newTaskRef.current?.()}>
            New
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <TableView
          key={schemaKey}
          dbId={dbId}
          properties={visible}
          tasks={sorted}
          newTaskRef={newTaskRef}
          onHide={toggleHidden}
          onSort={(propId, dir) => setSort({ propId, dir })}
          titleLabel={titleLabel}
          doneLabel={doneLabel}
          emptyColumns={emptyColumns}
        />
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
