import { cn } from '@/lib/cn';

interface Props {
  top?: boolean;
  bottom?: boolean;
  /** Tailwind color of the surface beneath the fade. Defaults to surface-1. */
  surface?: 'surface-1' | 'surface-2' | 'canvas';
  className?: string;
}

const surfaceMap = {
  'surface-1': { from: 'from-surface-1', to: 'to-surface-1' },
  'surface-2': { from: 'from-surface-2', to: 'to-surface-2' },
  canvas: { from: 'from-canvas', to: 'to-canvas' },
};

/**
 * Two thin gradient bands positioned absolutely at the top and bottom
 * of a scrollable region. Render them inside a `relative` parent that
 * also contains the scroll container. They fade content visually
 * without hiding it (unlike CSS mask-image).
 */
export function ScrollFade({ top, bottom, surface = 'surface-1', className }: Props) {
  const colors = surfaceMap[surface];
  return (
    <>
      {top && (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 h-4 z-10',
            'bg-gradient-to-b',
            colors.from,
            'to-transparent',
            className,
          )}
        />
      )}
      {bottom && (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-4 z-10',
            'bg-gradient-to-t',
            colors.from,
            'to-transparent',
            className,
          )}
        />
      )}
    </>
  );
}
