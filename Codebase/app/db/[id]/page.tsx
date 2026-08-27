import { redirect, notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { getDatabase, listDatabases, listProperties, listTasks } from '@/lib/store';
import Sidebar from '../../Sidebar';
import ViewSwitcher from './ViewSwitcher';
import DbTitle from './DbTitle';

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
        <DbTitle id={id} name={db.name} />
        <ViewSwitcher dbId={id} properties={listProperties(id)} tasks={listTasks(id)} />
      </main>
    </div>
  );
}
