import { redirect, notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { getDatabase, listDatabases, listProperties, listTasks, isPropertyColumnEmpty } from '@/lib/store';
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

  const props = listProperties(id);
  // Computed on the server so the client cannot claim a column is empty when it
  // is not. The route re-checks anyway; this only drives what the menu offers.
  const emptyColumns = Object.fromEntries(props.map((p) => [p.id, isPropertyColumnEmpty(id, p.id)]));

  return (
    <div className="shell">
      <Sidebar databases={listDatabases(user.id)} activeId={id} email={user.email} />
      <main className="main">
        <DbTitle id={id} name={db.name} />
        <ViewSwitcher
          dbId={id}
          properties={props}
          tasks={listTasks(id)}
          titleLabel={db.title_label}
          doneLabel={db.done_label}
          emptyColumns={emptyColumns}
        />
      </main>
    </div>
  );
}
