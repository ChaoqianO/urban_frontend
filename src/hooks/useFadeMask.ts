import { useEffect, useRef, useState } from 'react';

interface Edges {
  top: boolean;
  bottom: boolean;
}

const FADE = 18; // px of fade band
const EDGE_TOLERANCE = 4; // px slack when deciding "at edge"

function maskFromEdges({ top, bottom }: Edges): string | undefined {
  if (!top && !bottom) return undefined;
  if (top && bottom) {
    return `linear-gradient(to bottom, transparent 0, black ${FADE}px, black calc(100% - ${FADE}px), transparent 100%)`;
  }
  if (top) {
    return `linear-gradient(to bottom, transparent 0, black ${FADE}px, black 100%)`;
  }
  return `linear-gradient(to bottom, black 0, black calc(100% - ${FADE}px), transparent 100%)`;
}

/**
 * Returns a ref + style with mask-image that fades only the edges that
 * actually have hidden content. When scrolled to the very top or bottom,
 * the corresponding fade disappears so users see a clean edge.
 */
export function useFadeMask<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState<Edges>({ top: false, bottom: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const isScrollable = el.scrollHeight - el.clientHeight > 1;
      if (!isScrollable) {
        setEdges({ top: false, bottom: false });
        return;
      }
      // Tight tolerance: fade only disappears when the user is genuinely
      // at the edge (within 4px). Combined with deterministic row heights
      // upstream, this means the last/first row is fully visible BEFORE
      // the veil drops, never after.
      const atTop = el.scrollTop <= EDGE_TOLERANCE;
      const atBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - EDGE_TOLERANCE;
      setEdges({ top: !atTop, bottom: !atBottom });
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    // Recompute when children change (events arriving, agents added)
    const mo = new MutationObserver(update);
    mo.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  const mask = maskFromEdges(edges);
  const style: React.CSSProperties = mask
    ? { maskImage: mask, WebkitMaskImage: mask }
    : {};

  return { ref, style };
}
