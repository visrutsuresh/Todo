'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ponytail: login and signup differ only in endpoint and labels, so one
// component serves both. Deliberately unstyled beyond the bare minimum;
// visual design is a later, separate decision.
export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const res = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push('/');
      router.refresh();
      return;
    }

    const body = await res.json().catch(() => ({ message: 'Something went wrong.' }));
    setError(body.message ?? 'Something went wrong.');
    setBusy(false);
  }

  return (
    <main style={{ maxWidth: 320, margin: '80px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>{isSignup ? 'Create an account' : 'Sign in'}</h1>

      <form onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 12 }}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          required
          minLength={isSignup ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 12 }}
        />

        {error && (
          <p role="alert" style={{ color: '#b00' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={busy}>
          {busy ? 'Working...' : isSignup ? 'Sign up' : 'Sign in'}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        {isSignup ? (
          <>
            Already have an account? <Link href="/login">Sign in</Link>
          </>
        ) : (
          <>
            No account? <Link href="/signup">Sign up</Link>
          </>
        )}
      </p>
    </main>
  );
}
