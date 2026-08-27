'use client';

import type { Property } from '@/lib/props';

/**
 * Renders one property value as its native input control.
 * ponytail: every type except select maps to a plain HTML input, so there is
 * no custom widget code here. The browser handles date pickers, numeric
 * keypads and checkbox semantics better than a hand-rolled control.
 */
export default function PropCell({
  prop,
  value,
  onChange,
}: {
  prop: Property;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (prop.type) {
    case 'text':
      return (
        <input
          className="cell-input"
          type="text"
          aria-label={prop.name}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'number':
      return (
        <input
          className="cell-input"
          type="number"
          aria-label={prop.name}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        />
      );

    case 'date':
      return (
        <input
          className="cell-input"
          type="date"
          aria-label={prop.name}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        />
      );

    case 'checkbox':
      return (
        <input
          type="checkbox"
          aria-label={prop.name}
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
        />
      );

    case 'select':
      return (
        <select
          className="cell-select"
          aria-label={prop.name}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        >
          <option value="">Empty</option>
          {prop.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
  }
}
