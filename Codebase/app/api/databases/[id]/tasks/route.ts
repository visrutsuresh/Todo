import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getDatabase, listProperties, createTask } from '@/lib/store';
import { coercePatch } from '@/lib/props';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: 'Not signed in.' }, { status: 401 });

  const { id } = await params;
  if (!getDatabase(user.id, id)) return NextResponse.json({ message: 'Not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return NextResponse.json({ message: 'Task needs a title.' }, { status: 400 });

  let props: Record<string, unknown> = {};
  if (body.props && typeof body.props === 'object') {
    const r = coercePatch(listProperties(id), body.props as Record<string, unknown>);
    if (!r.ok) return NextResponse.json({ message: r.error }, { status: 400 });
    props = r.value;
  }

  return NextResponse.json(createTask(id, title, props), { status: 201 });
}
