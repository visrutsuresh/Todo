import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { listDatabases } from '@/lib/store';
import SignOutButton from './SignOutButton';
import NewDatabase from './NewDatabase';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect('/login');

  const dbs = listDatabases(user.id);
  if (dbs.length > 0) redirect(`/db/${dbs[0].id}`);

  return (
    <main style={{ maxWidth: 420, margin: '80px auto' }}>
      <p style={{ fontSize: 12, color: '#666' }}>{user.email}</p>
      <h1>No databases yet</h1>
      <p>A database holds your tasks and defines the properties they have.</p>
      <NewDatabase />
      <div style={{ marginTop: 24 }}>
        <SignOutButton />
      </div>
    </main>
  );
}
