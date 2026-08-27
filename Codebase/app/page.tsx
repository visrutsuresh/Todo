import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import SignOutButton from './SignOutButton';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect('/login');

  // Stage 4 replaces this with a redirect to the most recent database,
  // or an empty state offering to create the first one.
  return (
    <main style={{ padding: 32 }}>
      <p>Signed in as {user.email}</p>
      <SignOutButton />
    </main>
  );
}
