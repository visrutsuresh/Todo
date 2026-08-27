export const PROP_TYPES = ['text', 'number', 'select', 'date', 'checkbox'] as const;
export type PropType = (typeof PROP_TYPES)[number];

export type Property = {
  id: string;
  db_id: string;
  name: string;
  type: PropType;
  options: string[] | null;
  position: number;
};

export type Task = {
  id: string;
  db_id: string;
  title: string;
  done: boolean;
  props: Record<string, unknown>;
  position: number;
  created: string;
};

export function isPropType(v: unknown): v is PropType {
  return typeof v === 'string' && (PROP_TYPES as readonly string[]).includes(v);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates and normalises one property value against its declared type.
 * Returns { ok: true, value } or { ok: false, error }.
 *
 * null means "unset" for every type and is always allowed. That is distinct
 * from an empty string, which for a text property is a real (empty) value.
 */
export function coerceValue(
  prop: Pick<Property, 'name' | 'type' | 'options'>,
  raw: unknown
): { ok: true; value: unknown } | { ok: false; error: string } {
  if (raw === null || raw === undefined) return { ok: true, value: null };

  switch (prop.type) {
    case 'text':
      if (typeof raw !== 'string') return { ok: false, error: `${prop.name} must be text.` };
      return { ok: true, value: raw };

    case 'number': {
      // Accept a numeric string from a form input, but reject anything that is
      // not actually a finite number. Number('') is 0, which would silently
      // turn a cleared field into a zero, so empty string maps to unset.
      if (typeof raw === 'string' && raw.trim() === '') return { ok: true, value: null };
      const n = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(n)) return { ok: false, error: `${prop.name} must be a number.` };
      return { ok: true, value: n };
    }

    case 'select': {
      if (typeof raw !== 'string') return { ok: false, error: `${prop.name} must be one of its options.` };
      if (raw === '') return { ok: true, value: null };
      if (!prop.options?.includes(raw)) {
        return { ok: false, error: `"${raw}" is not an option for ${prop.name}.` };
      }
      return { ok: true, value: raw };
    }

    case 'date': {
      // Stored as a plain YYYY-MM-DD string, never a Date object and never an
      // ISO timestamp. A timestamp would shift the calendar day across
      // timezones, so "due Friday" could render as Thursday for another user.
      if (typeof raw !== 'string') return { ok: false, error: `${prop.name} must be a date.` };
      if (raw === '') return { ok: true, value: null };
      if (!ISO_DATE.test(raw)) return { ok: false, error: `${prop.name} must be formatted YYYY-MM-DD.` };
      const d = new Date(`${raw}T00:00:00Z`);
      if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== raw) {
        return { ok: false, error: `${prop.name} is not a real date.` };
      }
      return { ok: true, value: raw };
    }

    case 'checkbox':
      if (typeof raw === 'boolean') return { ok: true, value: raw };
      if (raw === 'true') return { ok: true, value: true };
      if (raw === 'false') return { ok: true, value: false };
      return { ok: false, error: `${prop.name} must be true or false.` };
  }
}

/**
 * Validates a whole patch of property values against the database's schema.
 * Unknown property ids are rejected rather than silently dropped, so a typo in
 * a property id surfaces as an error instead of a value that vanishes.
 */
export function coercePatch(
  props: Property[],
  patch: Record<string, unknown>
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const byId = new Map(props.map((p) => [p.id, p]));
  const out: Record<string, unknown> = {};

  for (const [id, raw] of Object.entries(patch)) {
    const prop = byId.get(id);
    if (!prop) return { ok: false, error: `Unknown property: ${id}` };
    const r = coerceValue(prop, raw);
    if (!r.ok) return r;
    out[id] = r.value;
  }
  return { ok: true, value: out };
}

/** Sorts values of one property type for table column sorting. */
export function compareValues(type: PropType, a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1;
  if (b === null || b === undefined) return -1;

  switch (type) {
    case 'number':
      return (a as number) - (b as number);
    case 'checkbox':
      return Number(a) - Number(b);
    case 'date':
    case 'text':
    case 'select':
      return String(a).localeCompare(String(b));
  }
}
