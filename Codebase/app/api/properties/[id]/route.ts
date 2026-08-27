import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getPropertyOwned, updateProperty, deleteProperty, listProperties } from '@/lib/store';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: 'Not signed in.' }, { status: 401 });

  const { id } = await params;
  const prop = getPropertyOwned(user.id, id);
  if (!prop) return NextResponse.json({ message: 'Not found.' }, { status: 404 });

  const { name, options } = await req.json().catch(() => ({}));
  const trimmed = typeof name === 'string' ? name.trim() : prop.name;
  if (!trimmed) return NextResponse.json({ message: 'Property needs a name.' }, { status: 400 });

  // Renaming to a name another property already uses would make the table
  // header ambiguous, so reject it. Keeping its own name is fine.
  const clash = listProperties(prop.db_id).some(
    (p) => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (clash) return NextResponse.json({ message: `A property called "${trimmed}" already exists.` }, { status: 409 });

  // Type is deliberately not editable. Changing a type would leave every
  // existing value in the old shape, and migrating them is out of scope.
  let opts = prop.options;
  if (prop.type === 'select' && options !== undefined) {
    if (!Array.isArray(options) || options.some((o) => typeof o !== 'string')) {
      return NextResponse.json({ message: 'Options must be a list of text values.' }, { status: 400 });
    }
    opts = [...new Set(options.map((o: string) => o.trim()).filter(Boolean))];
    if (opts.length === 0) return NextResponse.json({ message: 'Add at least one option.' }, { status: 400 });
  }

  const { cleared } = updateProperty(id, prop.db_id, trimmed, opts);
  return NextResponse.json({ ok: true, cleared });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: 'Not signed in.' }, { status: 401 });

  const { id } = await params;
  const prop = getPropertyOwned(user.id, id);
  if (!prop) return NextResponse.json({ message: 'Not found.' }, { status: 404 });

  deleteProperty(id, prop.db_id);
  return NextResponse.json({ ok: true });
}
