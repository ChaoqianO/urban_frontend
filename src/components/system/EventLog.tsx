import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSystemStore } from '@/store/useSystemStore';
import { formatAgentEventLogMessage, type AgentCommandStatus } from '@/store/useAgentActivityStore';
import { Panel } from '@/components/primitives/Panel';
import { cn } from '@/lib/cn';
import { useFadeMask } from '@/hooks/useFadeMask';
import { ScrollFade } from '@/components/primitives/ScrollFade';
import type { Severity } from '@/types';

const tone: Record<Severity, string> = {
  info: 'text-fg-3',
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
};

const statusTone: Record<AgentCommandStatus, string> = {
  accepted: 'border-fg-3/20 bg-surface-2 text-fg-2',
  running: 'border-warn/24 bg-warn/10 text-warn',
  completed: 'border-ok/24 bg-ok/10 text-ok',
  rejected: 'border-danger/24 bg-danger/10 text-danger',
  unknown: 'border-fg-3/20 bg-surface-2 text-fg-3',
};

function fmt(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(
    2,
    '0',
  )}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export function EventLog() {
  const allEvents = useSystemStore((s) => s.events);
  const events = useMemo(
    () =>
      allEvents.filter((e) => e.source === 'SCENARIO').sort((a, b) => b.timestamp - a.timestamp),
    [allEvents],
  );
  const fade = useFadeMask<HTMLDivElement>();

  return (
    <Panel
      tag="LOG"
      title="事件日志"
      collapsible
      state="live"
      className="flex-1 min-h-0"
      actions={<span className="font-mono text-2xs text-fg-3 tnum">{events.length}</span>}
    >
      <div className="relative h-full">
        <div
          ref={fade.ref}
          className="h-full overflow-auto px-4 pb-1 pt-1"
          style={{
            overscrollBehavior: 'contain',
          }}
        >
          <AnimatePresence initial={false}>
            {events.map((e) => {
              const formatted = formatAgentEventLogMessage(e.source, e.message);

              return (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.24 }}
                  className="flex min-h-[34px] items-center gap-2 border-b border-fg-1/6 py-1 last:border-b-0"
                >
                  <span className="w-[56px] shrink-0 font-mono text-2xs text-fg-4 tnum">
                    {fmt(e.timestamp)}
                  </span>
                  {formatted ? (
                    <>
                      <span
                        className={cn(
                          'shrink-0 rounded border px-1.5 py-0.5 text-2xs font-medium',
                          statusTone[formatted.status],
                        )}
                      >
                        {formatted.statusLabel}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-fg-1">
                          {formatted.displayText}
                        </div>
                        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.04em] text-fg-4">
                          <span className="shrink-0">{formatted.targetLabel}</span>
                          <span className="shrink-0 text-fg-4/70">/</span>
                          <span className="truncate">{formatted.kind}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span
                        className={cn(
                          'w-[60px] shrink-0 font-mono text-2xs uppercase tracking-[0.06em]',
                          tone[e.severity],
                        )}
                      >
                        {e.source}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs text-fg-2">{e.message}</span>
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <ScrollFade top={fade.top} bottom={fade.bottom} />
      </div>
    </Panel>
  );
}
