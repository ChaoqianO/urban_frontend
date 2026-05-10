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

export const useCommandStore = create<CommandState>((set, get) => ({
  history: [
    {
      id: 'c0',
      timestamp: Date.now() - 60_000,
      direction: 'system',
      target: 'SYS',
      text: '指挥中心已启动,等待指令输入',
    },
  ],
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
