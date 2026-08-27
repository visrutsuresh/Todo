'use client';

import { useState } from 'react';
import type { Property, Task } from '@/lib/props';
import TableView from './TableView';
import BoardView from './BoardView';
import { TableIcon, BoardIcon } from '../../Icons';

export type ViewName = 'table' | 'board';

const TABS: { id: ViewName; label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'table', label: 'Table', Icon: TableIcon },
  { id: 'board', label: 'Board', Icon: BoardIcon },
];

/**
 * Owns which view is showing. Kept in client state rather than the URL because
 * both views read the same already-fetched data, so switching costs no round
 * trip.
 */
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

  // Re-key on the property set so a deleted property cannot linger in a view's
  // client state after the server re-renders.
  const schemaKey = properties.map((p) => p.id).join(',');

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
      </div>

      {view === 'table' ? (
        <TableView key={schemaKey} dbId={dbId} properties={properties} tasks={tasks} />
      ) : (
        <BoardView
          key={schemaKey}
          properties={properties}
          tasks={tasks}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
        />
      )}
    </div>
  );
}
