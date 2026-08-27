import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getDatabase, renameDatabase, deleteDatabase, listProperties, listTasks, setSystemLabel } from '@/lib/store';

type Ctx = { params: Promise<{ id: string }> };

// A database the user does not own returns 404, not 403. 403 would confirm the
// id exists, which leaks the shape of other users' data.
const notFound = () => NextResponse.json({ message: 'Not found.' }, { status: 404 });

export async function GET(_req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: 'Not signed in.' }, { status: 401 });

  const { id } = await params;
  const db = getDatabase(user.id, id);
  if (!db) return notFound();

  // One fetch serves every view: the views differ only in how they render this.
  return NextResponse.json({ database: db, properties: listProperties(id), tasks: listTasks(id) });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: 'Not signed in.' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Renaming one of the two system columns.
  for (const [key, col] of [
    ['titleLabel', 'title_label'],
    ['doneLabel', 'done_label'],
  ] as const) {
    if (body[key] !== undefined) {
      const label = typeof body[key] === 'string' ? body[key].trim() : '';
      if (!label) return NextResponse.json({ message: 'Label cannot be empty.' }, { status: 400 });
      return setSystemLabel(user.id, id, col, label) ? NextResponse.json({ ok: true }) : notFound();
    }
  }

  const trimmed = typeof body.name === 'string' ? body.name.trim() : '';
  if (!trimmed) return NextResponse.json({ message: 'Name is required.' }, { status: 400 });

  return renameDatabase(user.id, id, trimmed) ? NextResponse.json({ ok: true }) : notFound();
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: 'Not signed in.' }, { status: 401 });

  const { id } = await params;
  return deleteDatabase(user.id, id) ? NextResponse.json({ ok: true }) : notFound();
}
