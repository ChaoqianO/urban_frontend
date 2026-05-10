import { cn } from '@/lib/cn';
import type { ConnectionState } from '@/types';

interface Props {
  state: ConnectionState;
  className?: string;
}

const colorMap: Record<ConnectionState, string> = {
  live: 'bg-ok shadow-[0_0_0_3px_rgb(110_140_118_/_0.20)]',
  reconnecting: 'bg-warn shadow-[0_0_0_3px_rgb(181_137_90_/_0.20)] animate-breathe',
  offline: 'bg-fg-4',
};

export function StatusDot({ state, className }: Props) {
  return (
    <span
      className={cn(
        'inline-block size-1.5 rounded-full transition-colors duration-240 ease-spring',
        colorMap[state],
        state === 'live' && 'animate-breathe',
        className,
      )}
    />
  );
}
