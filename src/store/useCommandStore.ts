import { create } from 'zustand';
import type { CommandRecord, Priority } from '@/types';

interface CommandState {
  history: CommandRecord[];
  pending: Map<string, CommandRecord>;
  inputHistory: string[];
  push: (record: Omit<CommandRecord, 'id' | 'timestamp'>) => CommandRecord;
  send: (text: string, target: string, priority: Priority) => CommandRecord;
  ack: (id: string, latencyMs: number, target?: string) => void;
  reject: (id: string, reason: string, target?: string) => void;
  pushInputHistory: (cmd: string) => void;
}

const seedHistory = (): CommandRecord[] => {
  const now = Date.now();
  return [
    {
      id: 'c0',
      timestamp: now - 240_000,
      direction: 'system',
      target: 'SYS',
      text: '指挥中心已启动,等待指令输入',
    },
    {
      id: 'c1',
      timestamp: now - 220_000,
      direction: 'out',
      target: 'ALL',
      text: 'patrol start',
    },
    {
      id: 'c2',
      timestamp: now - 219_700,
      direction: 'ack',
      target: 'UAV-01',
      text: 'acknowledged',
      latencyMs: 230,
    },
    {
      id: 'c3',
      timestamp: now - 219_500,
      direction: 'ack',
      target: 'UAV-02',
      text: 'acknowledged',
      latencyMs: 188,
    },
    {
      id: 'c4',
      timestamp: now - 219_300,
      direction: 'ack',
      target: 'UGV-01',
      text: 'acknowledged',
      latencyMs: 156,
    },
    {
      id: 'c5',
      timestamp: now - 180_000,
      direction: 'out',
      target: 'UAV-01',
      text: 'set-altitude 140',
    },
    {
      id: 'c6',
      timestamp: now - 179_700,
      direction: 'ack',
      target: 'UAV-01',
      text: 'altitude 140m',
      latencyMs: 198,
    },
    {
      id: 'c7',
      timestamp: now - 120_000,
      direction: 'warn',
      target: 'UAV-03',
      text: 'weak signal · -82 dBm',
    },
    {
      id: 'c8',
      timestamp: now - 90_000,
      direction: 'out',
      target: 'UAV-03',
      text: 'return-to-base',
    },
    {
      id: 'c9',
      timestamp: now - 89_700,
      direction: 'ack',
      target: 'UAV-03',
      text: 'rtb engaged',
      latencyMs: 412,
    },
    {
      id: 'c10',
      timestamp: now - 60_000,
      direction: 'out',
      target: 'UGV-02',
      text: 'collect at WP-12',
    },
    {
      id: 'c11',
      timestamp: now - 59_700,
      direction: 'ack',
      target: 'UGV-02',
      text: 'route accepted',
      latencyMs: 174,
    },
    {
      id: 'c12',
      timestamp: now - 30_000,
      direction: 'system',
      target: 'BRIDGE',
      text: 'telemetry rate 50Hz',
    },
    {
      id: 'c13',
      timestamp: now - 12_000,
      direction: 'reject',
      target: 'UAV-04',
      text: 'unauthorized — flight zone restricted',
    },
  ];
};

export const useCommandStore = create<CommandState>((set, get) => ({
  history: seedHistory(),
  pending: new Map(),
  inputHistory: [],

  push: (record) => {
    const next: CommandRecord = {
      ...record,
      id: `c${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    set((s) => ({ history: [...s.history, next].slice(-200) }));
    return next;
  },

  send: (text, target, priority) => {
    const record = get().push({ direction: 'out', target, text });
    const pending = new Map(get().pending);
    pending.set(record.id, record);
    set({ pending });
    void priority;
    return record;
  },

  ack: (id, latencyMs, target) => {
    const pending = new Map(get().pending);
    pending.delete(id);
    set({ pending });
    get().push({
      direction: 'ack',
      target: target ?? 'AGENT',
      text: 'acknowledged',
      latencyMs,
    });
  },

  reject: (id, reason, target) => {
    const pending = new Map(get().pending);
    pending.delete(id);
    set({ pending });
    get().push({
      direction: 'reject',
      target: target ?? 'AGENT',
      text: reason,
    });
  },

  pushInputHistory: (cmd) =>
    set((s) => {
      const next = [cmd, ...s.inputHistory.filter((c) => c !== cmd)].slice(0, 50);
      return { inputHistory: next };
    }),
}));
