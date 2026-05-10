import { Panel } from '@/components/primitives/Panel';
import { useSystemStore } from '@/store/useSystemStore';
import { NumberFlow } from '@/components/primitives/NumberFlow';
import { cn } from '@/lib/cn';

interface BarProps {
  label: string;
  value: number;
  tone?: 'accent' | 'ok' | 'warn';
}

function Bar({ label, value, tone = 'accent' }: BarProps) {
  const colorMap = {
    accent: 'bg-accent',
    ok: 'bg-ok',
    warn: 'bg-warn',
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-2xs uppercase tracking-[0.08em] text-fg-3">
          {label}
        </span>
        <span className="font-mono text-xs text-fg-1 tnum">
          <NumberFlow value={value} decimals={0} />%
        </span>
      </div>
      <div className="h-[3px] rounded-full bg-surface-3 overflow-hidden">
        <div
          className={cn('h-full transition-all duration-360 ease-spring', colorMap[tone])}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200;
  const h = 36;
  const step = w / (data.length - 1);
  const path = data
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const fill = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(79 140 255)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="rgb(79 140 255)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#spark-grad)" />
      <path d={path} fill="none" stroke="rgb(79 140 255)" strokeWidth="1.2" />
    </svg>
  );
}

export function Telemetry() {
  const sys = useSystemStore((s) => s.metrics);
  return (
    <Panel tag="SYS" title="系统遥测" collapsible state="live">
      <div className="px-4 py-3 flex flex-col gap-3">
        <Bar label="CPU" value={sys.cpu} />
        <Bar label="GPU" value={sys.gpu} />
        <Bar label="MEM" value={sys.mem} tone="ok" />
        <Bar label="NET" value={sys.net} tone="warn" />
      </div>
      <div className="px-4 pb-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="font-mono text-2xs uppercase tracking-[0.08em] text-fg-3">
            FRAME RATE · 60s
          </span>
          <span className="font-mono text-xs text-fg-1 tnum">
            <NumberFlow value={sys.fps} /> fps
          </span>
        </div>
        <Sparkline data={sys.fpsHistory} />
      </div>
    </Panel>
  );
}
