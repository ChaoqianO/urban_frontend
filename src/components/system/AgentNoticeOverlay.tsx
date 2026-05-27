import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Broadcast,
  CheckCircle,
  Fire,
  NavigationArrow,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { useAgentActivityStore, type AgentNotification } from '@/store/useAgentActivityStore';
import { cn } from '@/lib/cn';

const AUTO_DISMISS_MS = 9000;

const toneClass: Record<AgentNotification['severity'], { shell: string; icon: string; accent: string }> = {
  info: {
    shell: 'border-fg-1/12 bg-surface-1 text-fg-1',
    icon: 'bg-fg-1/8 text-fg-2',
    accent: 'bg-fg-3',
  },
  ok: {
    shell: 'border-ok/24 bg-[rgb(244_248_241)] text-fg-1',
    icon: 'bg-ok/14 text-ok',
    accent: 'bg-ok',
  },
  warn: {
    shell: 'border-warn/28 bg-[rgb(252_247_236)] text-fg-1',
    icon: 'bg-warn/16 text-warn',
    accent: 'bg-warn',
  },
  danger: {
    shell:
      'border-danger/30 bg-[rgb(253_243_241)] text-fg-1 shadow-[0_16px_46px_-24px_rgb(var(--state-danger)_/_0.72)]',
    icon: 'bg-danger/14 text-danger',
    accent: 'bg-danger',
  },
};

function fmt(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(
    2,
    '0',
  )}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function NoticeIcon({ notice }: { notice: AgentNotification }) {
  if (notice.severity === 'danger') return <Fire size={20} weight="fill" />;
  if (notice.severity === 'ok') return <CheckCircle size={20} weight="fill" />;
  if (notice.kind.includes('GOTO') || notice.kind.includes('RETURN')) {
    return <NavigationArrow size={20} weight="fill" />;
  }
  if (notice.severity === 'warn') return <WarningCircle size={20} weight="fill" />;
  return <Broadcast size={20} weight="fill" />;
}

function AgentNotice({ notice }: { notice: AgentNotification }) {
  const dismiss = useAgentActivityStore((s) => s.dismissNotification);
  const tone = toneClass[notice.severity];

  useEffect(() => {
    const timeout = window.setTimeout(() => dismiss(notice.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [dismiss, notice.id]);

  return (
    <motion.div
      key={notice.id}
      initial={{ opacity: 0, y: -18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        'pointer-events-auto w-[min(760px,calc(100vw-32px))] overflow-hidden rounded-md border',
        'font-sans tnum shadow-panel-elevated',
        tone.shell,
      )}
    >
      <div className={cn('h-1 w-full', tone.accent)} />
      <div className="flex items-center gap-3 px-5 py-3">
        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded', tone.icon)}>
          <NoticeIcon notice={notice} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold leading-tight tracking-normal">
            {notice.message}
          </div>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.08em] text-fg-3">
            <span>{notice.target.replace('-', '')}</span>
            <span className="text-fg-4">/</span>
            <span>{fmt(notice.timestamp)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dismiss(notice.id)}
          aria-label="关闭消息"
          className="flex size-7 shrink-0 items-center justify-center rounded text-fg-3 transition-colors duration-140 hover:bg-surface-2 hover:text-fg-1"
        >
          <X size={14} weight="bold" />
        </button>
      </div>
    </motion.div>
  );
}

export function AgentNoticeOverlay() {
  const latestNotice = useAgentActivityStore((s) => s.notifications[0]);

  return (
    <div className="pointer-events-none fixed left-1/2 top-12 z-50 -translate-x-1/2">
      <AnimatePresence mode="wait" initial={false}>
        {latestNotice && <AgentNotice key={latestNotice.id} notice={latestNotice} />}
      </AnimatePresence>
    </div>
  );
}
