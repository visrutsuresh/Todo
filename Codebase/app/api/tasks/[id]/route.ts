import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getTaskOwned, updateTask, deleteTask, listProperties } from '@/lib/store';
import { coercePatch } from '@/lib/props';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: 'Not signed in.' }, { status: 401 });

  const { id } = await params;
  const task = getTaskOwned(user.id, id);
  if (!task) return NextResponse.json({ message: 'Not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const patch: { title?: string; done?: boolean; props?: Record<string, unknown>; position?: number } = {};

  if (body.title !== undefined) {
    const t = typeof body.title === 'string' ? body.title.trim() : '';
    if (!t) return NextResponse.json({ message: 'Task needs a title.' }, { status: 400 });
    patch.title = t;
  }
  if (body.done !== undefined) {
    if (typeof body.done !== 'boolean') return NextResponse.json({ message: 'done must be true or false.' }, { status: 400 });
    patch.done = body.done;
  }
  if (body.position !== undefined) {
    if (!Number.isInteger(body.position)) return NextResponse.json({ message: 'position must be a whole number.' }, { status: 400 });
    patch.position = body.position;
  }
  if (body.props !== undefined) {
    if (typeof body.props !== 'object' || body.props === null) {
      return NextResponse.json({ message: 'props must be an object.' }, { status: 400 });
    }
    const r = coercePatch(listProperties(task.db_id), body.props as Record<string, unknown>);
    if (!r.ok) return NextResponse.json({ message: r.error }, { status: 400 });
    patch.props = r.value;
  }

  updateTask(id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: 'Not signed in.' }, { status: 401 });

  const { id } = await params;
  if (!getTaskOwned(user.id, id)) return NextResponse.json({ message: 'Not found.' }, { status: 404 });

  deleteTask(id);
  return NextResponse.json({ ok: true });
}
