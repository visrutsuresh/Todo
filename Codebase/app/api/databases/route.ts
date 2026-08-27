import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { listDatabases, createDatabase } from '@/lib/store';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: 'Not signed in.' }, { status: 401 });
  return NextResponse.json(listDatabases(user.id));
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: 'Not signed in.' }, { status: 401 });

  const { name } = await req.json().catch(() => ({}));
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) return NextResponse.json({ message: 'Name is required.' }, { status: 400 });

  return NextResponse.json(createDatabase(user.id, trimmed), { status: 201 });
}
