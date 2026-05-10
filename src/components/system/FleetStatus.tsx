import { Panel } from '@/components/primitives/Panel';
import { Badge } from '@/components/primitives/Badge';
import { Drone, Truck } from '@phosphor-icons/react';
import { useMockStore } from '@/store/useMockStore';
import { cn } from '@/lib/cn';

interface AgentRow {
  id: string;
  kind: 'uav' | 'ugv';
  state: 'live' | 'reconnecting' | 'offline';
  battery: number;
  signal: number;
}

const agents: AgentRow[] = [
  { id: 'UAV-01', kind: 'uav', state: 'live', battery: 87, signal: 0.92 },
  { id: 'UAV-02', kind: 'uav', state: 'live', battery: 64, signal: 0.81 },
  { id: 'UAV-03', kind: 'uav', state: 'reconnecting', battery: 41, signal: 0.32 },
  { id: 'UGV-01', kind: 'ugv', state: 'live', battery: 92, signal: 0.95 },
  { id: 'UGV-02', kind: 'ugv', state: 'live', battery: 73, signal: 0.88 },
];

export function FleetStatus() {
  const total = useMockStore((s) => s.city.vehicles);
  void total;
  return (
    <Panel tag="FLEET" title="智能体状态" collapsible state="live">
      <div className="px-4 py-3 grid grid-cols-3 gap-3 border-b border-hairline">
        <div className="flex flex-col">
          <span className="font-mono text-2xs uppercase tracking-[0.08em] text-fg-3">
            ACTIVE
          </span>
          <span className="font-mono text-lg text-fg-1 tnum mt-0.5">24</span>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-2xs uppercase tracking-[0.08em] text-fg-3">
            UAV
          </span>
          <span className="font-mono text-lg text-fg-1 tnum mt-0.5">12</span>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-2xs uppercase tracking-[0.08em] text-fg-3">
            UGV
          </span>
          <span className="font-mono text-lg text-fg-1 tnum mt-0.5">12</span>
        </div>
      </div>
      <ul className="px-2 py-1 max-h-44 overflow-auto">
        {agents.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-3 px-2 py-2 rounded hover:bg-surface-2 transition-colors duration-140 cursor-pointer"
          >
            <div
              className={cn(
                'flex items-center justify-center size-7 rounded',
                a.kind === 'uav' ? 'bg-accent/10 text-accent' : 'bg-surface-3 text-fg-2',
              )}
            >
              {a.kind === 'uav' ? (
                <Drone size={14} weight="duotone" />
              ) : (
                <Truck size={14} weight="duotone" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-fg-1 tnum">{a.id}</span>
                {a.state !== 'live' && (
                  <Badge tone={a.state === 'reconnecting' ? 'warn' : 'danger'}>
                    {a.state}
                  </Badge>
                )}
              </div>
              <div className="mt-1 h-1 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-360 ease-spring',
                    a.battery > 50 ? 'bg-ok' : a.battery > 20 ? 'bg-warn' : 'bg-danger',
                  )}
                  style={{ width: `${a.battery}%` }}
                />
              </div>
            </div>
            <span className="font-mono text-2xs text-fg-3 tnum">
              {a.battery.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
