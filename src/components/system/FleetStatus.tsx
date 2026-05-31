import { Panel } from '@/components/primitives/Panel';
import { Drone, Truck } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { useFadeMask } from '@/hooks/useFadeMask';
import { ScrollFade } from '@/components/primitives/ScrollFade';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { useAgentActivityStore, type AgentCommandStatus } from '@/store/useAgentActivityStore';

interface AgentRow {
  id: string;
  kind: 'uav' | 'ugv';
  state: 'live' | 'reconnecting' | 'offline';
  battery: number;
  signal: number;
}

const agents: AgentRow[] = [
  { id: 'UAV-01', kind: 'uav', state: 'live', battery: 87, signal: 0.92 },
  { id: 'UAV-02', kind: 'uav', state: 'reconnecting', battery: 41, signal: 0.32 },
  { id: 'UAV-03', kind: 'uav', state: 'live', battery: 64, signal: 0.81 },
  { id: 'UAV-04', kind: 'uav', state: 'live', battery: 78, signal: 0.86 },
  { id: 'UGV-01', kind: 'ugv', state: 'live', battery: 92, signal: 0.95 },
  { id: 'UGV-02', kind: 'ugv', state: 'live', battery: 73, signal: 0.88 },
  { id: 'UGV-03', kind: 'ugv', state: 'live', battery: 56, signal: 0.79 },
  { id: 'UGV-04', kind: 'ugv', state: 'offline', battery: 18, signal: 0 },
];

const statusTone: Record<AgentCommandStatus, string> = {
  accepted: 'text-fg-3',
  running: 'text-warn',
  completed: 'text-ok',
  rejected: 'text-danger',
  unknown: 'text-fg-3',
};

export function FleetStatus() {
  const fade = useFadeMask<HTMLUListElement>();
  const uav = useTelemetryStore((s) => s.uav);
  const ugv = useTelemetryStore((s) => s.ugv);
  const activities = useAgentActivityStore((s) => s.activitiesByTarget);

  const rows = agents.map((agent) => {
    if (agent.id === uav.id) {
      return { ...agent, battery: uav.battery, signal: uav.link.quality };
    }
    if (agent.id === ugv.id) {
      return { ...agent, battery: ugv.battery, signal: ugv.link.quality };
    }
    return agent;
  });

  return (
    <Panel tag="FLEET" title="智能体状态" collapsible state="live" className="shrink-0">
      <div className="relative">
        <ul
          ref={fade.ref}
          style={{
            gridAutoRows: '44px',
            overscrollBehavior: 'contain',
          }}
          className="px-2 pt-1 pb-1 grid grid-cols-2 gap-x-2 gap-y-0.5 overflow-auto"
        >
          {rows.map((a) => {
            const activity = activities[a.id];
            return (
              <li
                key={a.id}
                className="flex items-center gap-2 px-1.5 rounded hover:bg-surface-2 transition-colors duration-140 cursor-pointer min-w-0 h-11"
              >
                <div
                  className={cn(
                    'flex items-center justify-center size-6 rounded shrink-0',
                    a.kind === 'uav' ? 'bg-accent/10 text-accent' : 'bg-surface-3 text-fg-2',
                  )}
                >
                  {a.kind === 'uav' ? (
                    <Drone size={12} weight="duotone" />
                  ) : (
                    <Truck size={12} weight="duotone" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-2xs text-fg-1 tnum truncate">
                      {a.id}
                    </span>
                    <span
                      className={cn(
                        'font-mono text-[10px] shrink-0',
                        a.signal > 0.75
                          ? 'text-ok'
                          : a.signal > 0.35
                            ? 'text-warn'
                            : 'text-danger',
                      )}
                      title={`signal ${(a.signal * 100).toFixed(0)}%`}
                    >
                      {(a.signal * 100).toFixed(0)}%
                    </span>
                    {a.state !== 'live' && (
                      <span
                        className={cn(
                          'size-1 rounded-full shrink-0',
                          a.state === 'reconnecting' ? 'bg-warn animate-breathe' : 'bg-danger',
                        )}
                        title={a.state}
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      'mt-0.5 flex items-center gap-1 min-w-0 font-mono text-[10px] leading-none',
                      activity ? statusTone[activity.status] : 'text-fg-4',
                    )}
                    title={activity?.summary ?? 'no agent command'}
                  >
                    {activity ? (
                      <span className="truncate">{activity.displayText}</span>
                    ) : (
                      <span className="truncate">等待指令</span>
                    )}
                  </div>
                  <div
                    className="mt-0.5 h-[3px] rounded-full bg-surface-3 overflow-hidden"
                    title={`battery ${a.battery.toFixed(0)}%`}
                  >
                    <div
                      className={cn(
                        'h-full transition-all duration-360 ease-spring',
                        a.battery > 50 ? 'bg-ok' : a.battery > 20 ? 'bg-warn' : 'bg-danger',
                      )}
                      style={{ width: `${a.battery}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <ScrollFade top={fade.top} bottom={fade.bottom} />
      </div>
    </Panel>
  );
}
