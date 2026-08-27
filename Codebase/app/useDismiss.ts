'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Closes a transient surface (popover, menu, inline form) when the user clicks
 * anywhere outside it or presses Escape.
 *
 * ponytail: one hook instead of the same two listeners copy-pasted into every
 * popover. Four components had their own version of this, and the two newest
 * surfaces were simply missing it, which is exactly how that kind of
 * duplication fails: the bug is not in the copies, it is in the one that was
 * never written.
 *
 * `mousedown` rather than `click`, deliberately: a click fires after the
 * element under the cursor has already handled it, so a menu item would run
 * and then the menu would close with a visible flicker.
 */
export function useDismiss(
  active: boolean,
  onDismiss: () => void,
  refs: RefObject<HTMLElement | null>[]
) {
  useEffect(() => {
    if (!active) return;

    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (refs.some((r) => r.current?.contains(target))) return;
      onDismiss();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss();
    }

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, onDismiss]);
}
