import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSystemStore } from '@/store/useSystemStore';
import { Panel } from '@/components/primitives/Panel';
import { cn } from '@/lib/cn';
import { useFadeMask } from '@/hooks/useFadeMask';
import { ScrollFade } from '@/components/primitives/ScrollFade';

type Action = 'accept' | 'reject';

interface Parsed {
  action: Action;
  target: string | null;
  kind: string | null;
  taskId: string | null;
  rest: string;
}

interface Row extends Parsed {
  id: string;
  timestamp: number;
  title: string;
}

const INSTRUCTION_RE = /^(accept|reject)\s/i;
const IGNORED_KINDS = new Set(['UAV_HOLD']);

function readableTarget(target: string | null) {
  return target ? target.replace('-', '') : '未知智能体';
}

function isReturnCommand(kind: string | null) {
  return kind ? /RETURN|RTB|RTL|BACK|HOME/i.test(kind) : false;
}

function parseInstruction(message: string): Parsed | null {
  const m = INSTRUCTION_RE.exec(message);
  if (!m) return null;
  const action = m[1].toLowerCase() as Action;

  const tokens = message.trim().split(/\s+/);
  const taskId = tokens[1] && !tokens[1].includes('=') ? tokens[1] : null;
  const startIndex = taskId ? 2 : 1;

  let target: string | null = null;
  let kind: string | null = null;
  const others: string[] = [];

  for (const tok of tokens.slice(startIndex)) {
    const eq = tok.indexOf('=');
    if (eq <= 0) {
      others.push(tok);
      continue;
    }

    const key = tok.slice(0, eq);
    const val = tok.slice(eq + 1);
    if (key === 'target') target = val;
    else if (key === 'kind') kind = val;
    else others.push(tok);
  }

  if (kind && IGNORED_KINDS.has(kind)) return null;
  return { action, target, kind, taskId, rest: others.join(' ') };
}

function commandTitle(row: Parsed) {
  const name = readableTarget(row.target);

  if (row.action === 'reject') {
    if (row.kind === 'UGV_EXTINGUISH') return `拒绝 ${name} 执行灭火`;
    if (isReturnCommand(row.kind)) return `拒绝 ${name} 返航`;
    return `拒绝 ${name} 执行调度指令`;
  }

  if (row.kind === 'UAV_PATROL') return `安排 ${name} 巡查火情`;
  if (row.kind === 'UAV_GOTO') return `指派 ${name} 前往火情位置`;
  if (row.kind === 'UGV_GOTO') return `调度 ${name} 赶往火灾地点`;
  if (row.kind === 'UGV_EXTINGUISH') return `指派 ${name} 执行灭火`;
  if (isReturnCommand(row.kind)) return `指派 ${name} 返航`;
  if (row.kind) return `指派 ${name} 执行 ${row.kind}`;
  return `向 ${name} 下发调度指令`;
}

function fmt(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(
    2,
    '0',
  )}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export function AgentInstructions() {
  const events = useSystemStore((s) => s.events);
  const fade = useFadeMask<HTMLDivElement>();

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const e of events) {
      if (e.source !== 'AGENT') continue;
      const parsed = parseInstruction(e.message);
      if (!parsed) continue;
      out.push({
        id: e.id,
        timestamp: e.timestamp,
        ...parsed,
        title: commandTitle(parsed),
      });
    }
    return out.sort((a, b) => b.timestamp - a.timestamp);
  }, [events]);

  return (
    <Panel
      tag="AGENT"
      title="智能体指令"
      collapsible
      state="live"
      className="flex-1 min-h-0"
      actions={<span className="font-mono text-2xs text-fg-3 tnum">{rows.length}</span>}
    >
      <div className="relative h-full">
        <div
          ref={fade.ref}
          className="h-full overflow-auto px-4 pb-1 pt-1"
          style={{
            overscrollBehavior: 'contain',
          }}
        >
          {rows.length === 0 ? (
            <div className="flex h-[34px] items-center text-xs text-fg-4">
              暂无 UrbanAgent 调度指令
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.24 }}
                  className="flex min-h-[34px] items-center gap-2 border-b border-fg-1/6 py-1 last:border-b-0"
                >
                  <span className="w-[56px] shrink-0 font-mono text-2xs text-fg-4 tnum">
                    {fmt(r.timestamp)}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded border px-1.5 py-0.5 text-2xs font-medium',
                      r.action === 'accept'
                        ? 'border-ok/24 bg-ok/10 text-ok'
                        : 'border-danger/24 bg-danger/10 text-danger',
                    )}
                  >
                    {r.action === 'accept' ? '已下发' : '已拒绝'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-fg-1">{r.title}</div>
                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.04em] text-fg-4">
                      <span className="shrink-0">{readableTarget(r.target)}</span>
                      {r.kind ? (
                        <>
                          <span className="shrink-0 text-fg-4/70">/</span>
                          <span className="truncate">{r.kind}</span>
                        </>
                      ) : null}
                      {r.taskId ? (
                        <>
                          <span className="shrink-0 text-fg-4/70">/</span>
                          <span className="truncate normal-case">{r.taskId}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        <ScrollFade top={fade.top} bottom={fade.bottom} />
      </div>
    </Panel>
  );
}
