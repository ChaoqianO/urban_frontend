import { useEffect, useState } from 'react';
import { Polygon, ArrowsClockwise, Gear, Lightning, Keyboard } from '@phosphor-icons/react';
import { useSystemStore } from '@/store/useSystemStore';
import { StatusDot } from '@/components/primitives/StatusDot';
import { NumberFlow } from '@/components/primitives/NumberFlow';
import { Badge } from '@/components/primitives/Badge';

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const fmtTime = (d: Date) => d.toTimeString().slice(0, 8);
const fmtDate = (d: Date) =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')}`;

interface HeaderProps {
  onShowShortcuts?: () => void;
}

export function Header({ onShowShortcuts }: HeaderProps = {}) {
  const connection = useSystemStore((s) => s.connection);
  const source = useSystemStore((s) => s.source);
  const fps = useSystemStore((s) => s.metrics.fps);
  const now = useNow();

  const stateLabel =
    connection === 'live' ? 'LIVE' : connection === 'reconnecting' ? 'CONNECTING' : 'OFFLINE';

  return (
    <header className="h-16 shrink-0 px-6 flex items-center justify-between border-b border-hairline">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center size-8 rounded bg-accent/10 text-accent">
          <Polygon size={18} weight="duotone" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-mono text-2xs uppercase tracking-[0.16em] text-fg-3">
            URBAN · DIGITAL TWIN
          </span>
          <h1 className="text-sm font-semibold text-fg-1">数字孪生城市指挥中心</h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <StatusDot state={connection} />
          <span className="font-mono text-2xs uppercase tracking-[0.08em] text-fg-2">
            {stateLabel}
          </span>
          {source === 'mock' && (
            <Badge tone="warn" className="ml-1">
              <Lightning size={9} weight="bold" className="mr-1" />
              DEMO
            </Badge>
          )}
        </div>
        <div className="h-5 w-px bg-hairline" />
        <div className="flex items-center gap-3 font-mono tnum">
          <span className="text-sm text-fg-1">{fmtTime(now)}</span>
          <span className="text-2xs text-fg-3">{fmtDate(now)} UTC+8</span>
        </div>
        <div className="h-5 w-px bg-hairline" />
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end leading-tight">
            <span className="font-mono text-2xs uppercase tracking-[0.08em] text-fg-3">
              FPS
            </span>
            <span className="font-mono text-sm text-fg-1 tnum">
              <NumberFlow value={fps} />
            </span>
          </div>
          <div className="flex flex-col items-end leading-tight">
            <span className="font-mono text-2xs uppercase tracking-[0.08em] text-fg-3">
              AGENTS
            </span>
            <span className="font-mono text-sm text-fg-1 tnum">8</span>
          </div>
        </div>
        <div className="h-5 w-px bg-hairline" />
        <div className="flex items-center gap-1">
          <button
            onClick={onShowShortcuts}
            className="size-8 inline-flex items-center justify-center text-fg-3 hover:text-fg-1 hover:bg-surface-2 rounded transition-colors duration-140"
            aria-label="键盘快捷键"
            title="? 快捷键"
          >
            <Keyboard size={14} />
          </button>
          <button
            className="size-8 inline-flex items-center justify-center text-fg-3 hover:text-fg-1 hover:bg-surface-2 rounded transition-colors duration-140"
            aria-label="重连"
          >
            <ArrowsClockwise size={14} />
          </button>
          <button
            className="size-8 inline-flex items-center justify-center text-fg-3 hover:text-fg-1 hover:bg-surface-2 rounded transition-colors duration-140"
            aria-label="设置"
          >
            <Gear size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
