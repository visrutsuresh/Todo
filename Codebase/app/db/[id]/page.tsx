import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { getDatabase, listDatabases, listProperties, listTasks } from '@/lib/store';
import SignOutButton from '../../SignOutButton';
import NewDatabase from '../../NewDatabase';
import TableView from './TableView';
import AddProperty from './AddProperty';

export const dynamic = 'force-dynamic';

export default async function DatabasePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const db = getDatabase(user.id, id);
  if (!db) notFound();

  const all = listDatabases(user.id);
  const properties = listProperties(id);
  const tasks = listTasks(id);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, borderRight: '1px solid #ddd', padding: 16 }}>
        <p style={{ fontSize: 12, color: '#666' }}>{user.email}</p>
        <SignOutButton />

        <h2 style={{ fontSize: 14, marginTop: 24 }}>Databases</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {all.map((d) => (
            <li key={d.id} style={{ marginBottom: 4 }}>
              <Link href={`/db/${d.id}`} style={{ fontWeight: d.id === id ? 700 : 400 }}>
                {d.name}
              </Link>
            </li>
          ))}
        </ul>
        <NewDatabase />
      </aside>

      <main style={{ flex: 1, padding: 24 }}>
        <h1>{db.name}</h1>

        {/* key forces a fresh client state tree when the schema changes,
            so a deleted property cannot linger in TableView's task rows. */}
        <TableView
          key={properties.map((p) => p.id).join(',')}
          dbId={id}
          properties={properties}
          tasks={tasks}
        />

        <div style={{ marginTop: 16 }}>
          <AddProperty dbId={id} />
        </div>
      </main>
    </div>
  );
}
