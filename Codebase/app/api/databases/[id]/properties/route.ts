import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getDatabase, createProperty, listProperties } from '@/lib/store';
import { isPropType } from '@/lib/props';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: 'Not signed in.' }, { status: 401 });

  const { id } = await params;
  if (!getDatabase(user.id, id)) return NextResponse.json({ message: 'Not found.' }, { status: 404 });

  const { name, type, options } = await req.json().catch(() => ({}));

  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) return NextResponse.json({ message: 'Property needs a name.' }, { status: 400 });
  if (!isPropType(type)) return NextResponse.json({ message: 'Unsupported property type.' }, { status: 400 });

  // Duplicate names would make the table header ambiguous. Values are keyed by
  // id so it would not corrupt data, but it is confusing, so reject it.
  if (listProperties(id).some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
    return NextResponse.json({ message: `A property called "${trimmed}" already exists.` }, { status: 409 });
  }

  let opts: string[] | null = null;
  if (type === 'select') {
    if (!Array.isArray(options) || options.some((o) => typeof o !== 'string')) {
      return NextResponse.json({ message: 'A select property needs a list of options.' }, { status: 400 });
    }
    opts = [...new Set(options.map((o: string) => o.trim()).filter(Boolean))];
    if (opts.length === 0) return NextResponse.json({ message: 'Add at least one option.' }, { status: 400 });
  }

  return NextResponse.json(createProperty(id, trimmed, type, opts), { status: 201 });
}
