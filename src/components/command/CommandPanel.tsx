import { Panel } from '@/components/primitives/Panel';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { useMockStore } from '@/store/useMockStore';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { ArrowRight, Check, Warning, X, Terminal } from '@phosphor-icons/react';
import type { CommandRecord, Priority } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const targets = ['ALL', 'UAV', 'UGV', 'UAV-01', 'UAV-02', 'UGV-01', 'UGV-02'] as const;
const priorities: Priority[] = ['normal', 'high', 'urgent'];
const quickCmds = [
  { label: '返回基地', cmd: 'return-to-base' },
  { label: '悬停待命', cmd: 'hold' },
  { label: '开始巡逻', cmd: 'patrol' },
  { label: '数据采集', cmd: 'collect' },
];
const dangerCmds = [
  { label: '紧急停止', cmd: 'estop' },
  { label: '安全撤离', cmd: 'evacuate' },
];

function fmtTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(
    2,
    '0',
  )}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function DirectionIcon({ direction }: { direction: CommandRecord['direction'] }) {
  switch (direction) {
    case 'out':
      return <ArrowRight size={11} weight="bold" className="text-accent" />;
    case 'ack':
      return <Check size={11} weight="bold" className="text-ok" />;
    case 'reject':
      return <X size={11} weight="bold" className="text-danger" />;
    case 'warn':
      return <Warning size={11} weight="bold" className="text-warn" />;
    case 'system':
      return <Terminal size={11} weight="bold" className="text-fg-3" />;
  }
}

export function CommandPanel() {
  const commands = useMockStore((s) => s.commands);
  const push = useMockStore((s) => s.pushCommand);
  const [target, setTarget] = useState<(typeof targets)[number]>('ALL');
  const [priority, setPriority] = useState<Priority>('normal');
  const [text, setText] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    streamRef.current?.scrollTo({
      top: streamRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [commands.length]);

  const send = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    push({ direction: 'out', target, text: cmd });
    setText('');
    setTimeout(() => {
      push({
        direction: 'ack',
        target: target === 'ALL' ? 'UAV-01' : target,
        text: 'acknowledged',
        latencyMs: 180 + Math.round(Math.random() * 120),
      });
    }, 600);
  };

  const handleDanger = (cmd: { label: string; cmd: string }) => {
    if (confirming === cmd.cmd) {
      send(cmd.cmd);
      setConfirming(null);
    } else {
      setConfirming(cmd.cmd);
      setTimeout(() => setConfirming((c) => (c === cmd.cmd ? null : c)), 2400);
    }
  };

  return (
    <Panel
      tag="CMD"
      title="智能体指令"
      collapsible
      state="live"
      bodyClassName="flex flex-col"
      className="flex-1 min-h-0"
    >
      {/* Target & Priority */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-hairline">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as typeof target)}
          className="flex-1 h-8 px-2 rounded bg-surface-2 border border-hairline text-xs text-fg-1 font-mono tnum focus:outline-none focus:border-accent/40 transition-colors duration-140"
        >
          {targets.map((t) => (
            <option key={t} value={t}>
              {t === 'ALL' ? '全体智能体' : t}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="h-8 px-2 rounded bg-surface-2 border border-hairline text-xs text-fg-1 font-mono uppercase tracking-[0.06em] focus:outline-none focus:border-accent/40 transition-colors duration-140"
        >
          {priorities.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Quick */}
      <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-hairline">
        {quickCmds.map((q) => (
          <Button key={q.cmd} onClick={() => send(q.cmd)}>
            {q.label}
          </Button>
        ))}
        {dangerCmds.map((q) => (
          <Button
            key={q.cmd}
            variant="danger"
            onClick={() => handleDanger(q)}
            className={cn(confirming === q.cmd && 'animate-pulse')}
          >
            {confirming === q.cmd ? `确认 ${q.label}?` : q.label}
          </Button>
        ))}
      </div>

      {/* Stream */}
      <div
        ref={streamRef}
        className="flex-1 min-h-0 overflow-auto px-4 py-3 space-y-1.5"
      >
        <AnimatePresence initial={false}>
          {commands.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
              className="flex items-baseline gap-2 group"
            >
              <span className="font-mono text-2xs text-fg-4 tnum shrink-0 w-[60px]">
                {fmtTime(c.timestamp)}
              </span>
              <span className="shrink-0 translate-y-px">
                <DirectionIcon direction={c.direction} />
              </span>
              <span
                className={cn(
                  'font-mono text-2xs uppercase tracking-[0.06em] tnum w-[60px] shrink-0',
                  c.direction === 'out' && 'text-accent',
                  c.direction === 'ack' && 'text-ok',
                  c.direction === 'warn' && 'text-warn',
                  c.direction === 'reject' && 'text-danger',
                  c.direction === 'system' && 'text-fg-3',
                )}
              >
                {c.target}
              </span>
              <span className="text-xs text-fg-2 truncate">{c.text}</span>
              {c.latencyMs !== undefined && (
                <span className="font-mono text-2xs text-fg-4 tnum ml-auto shrink-0">
                  {c.latencyMs}ms
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-hairline flex gap-2">
        <Input
          placeholder="输入指令,Enter 发送..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send(text);
          }}
          className="font-mono"
        />
        <Button variant="primary" size="md" onClick={() => send(text)}>
          发送
        </Button>
      </div>
    </Panel>
  );
}
