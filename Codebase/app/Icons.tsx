import type { PropType } from '@/lib/props';

/**
 * Real SVGs rather than unicode glyphs. Geist Mono has no coverage for the box
 * drawing and geometric characters this UI wanted, so they rendered as tofu
 * squares. An icon you cannot guarantee the font ships is not an icon.
 */

const box = (d: React.SVGProps<SVGSVGElement>) => ({
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  'aria-hidden': true as const,
  ...d,
});

export function DatabaseIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...box(p)}>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18M9 9v11" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function TableIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...box(p)}>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18M3 15h18M10 10v10" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function BoardIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...box(p)}>
      <rect x="3" y="4" width="5" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="9.5" y="4" width="5" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="16" y="4" width="5" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function PlusIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...box(p)}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...box(p)}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MoreIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...box(p)}>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function ChevronIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...box(p)}>
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* one per property type, matching Notion's column-header glyphs */

function TextIcon() {
  return (
    <svg {...box({})}>
      <path d="M4 18 9 6l5 12M5.6 14.5h6.8M17 18v-6M17 12a2.5 2.5 0 1 1 3 2.45V18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NumberIcon() {
  return (
    <svg {...box({})}>
      <path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SelectIcon() {
  return (
    <svg {...box({})}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 12l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DateIcon() {
  return (
    <svg {...box({})}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 10h17M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CheckboxIcon() {
  return (
    <svg {...box({})}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.5 12l3 3 6-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const TYPE_ICON: Record<PropType, React.ComponentType> = {
  text: TextIcon,
  number: NumberIcon,
  select: SelectIcon,
  date: DateIcon,
  checkbox: CheckboxIcon,
};
