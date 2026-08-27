import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { listDatabases } from '@/lib/store';
import Sidebar from './Sidebar';
import Landing from './Landing';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect('/login');

  const dbs = listDatabases(user.id);

  // Obsidian opens on an empty pane with actions rather than auto-opening a
  // file, so no database is loaded here either.
  return (
    <div className="shell">
      <Sidebar databases={dbs} email={user.email} />
      <Landing hasDatabases={dbs.length > 0} firstId={dbs[0]?.id} />
    </div>
  );
}
