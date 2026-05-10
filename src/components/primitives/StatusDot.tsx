import { cn } from '@/lib/cn';
import type { ConnectionState } from '@/types';

interface Props {
  state: ConnectionState;
  className?: string;
}

const colorMap: Record<ConnectionState, string> = {
  live: 'bg-ok shadow-[0_0_0_3px_rgb(43_182_115_/_0.18)]',
  reconnecting: 'bg-warn shadow-[0_0_0_3px_rgb(232_163_61_/_0.18)] animate-breathe',
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
