'use client';

import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();

  // A plain <form action="/api/auth/logout"> would navigate the browser to the
  // route's JSON response. Fetch, then route client-side instead.
  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut}>
      Sign out
    </button>
  );
}
