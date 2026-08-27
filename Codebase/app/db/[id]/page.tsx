import { redirect, notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { getDatabase, listDatabases, listProperties, listTasks } from '@/lib/store';
import Sidebar from '../../Sidebar';
import ViewSwitcher from './ViewSwitcher';
import { DatabaseIcon } from '../../Icons';

export const dynamic = 'force-dynamic';

export default async function DatabasePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const db = getDatabase(user.id, id);
  if (!db) notFound();

  return (
    <div className="shell">
      <Sidebar databases={listDatabases(user.id)} activeId={id} email={user.email} />
      <main className="main">
        <h1 className="db-title">
          <span className="db-title-icon">
            <DatabaseIcon width={26} height={26} />
          </span>
          {db.name}
        </h1>
        <ViewSwitcher dbId={id} properties={listProperties(id)} tasks={listTasks(id)} />
      </main>
    </div>
  );
}
