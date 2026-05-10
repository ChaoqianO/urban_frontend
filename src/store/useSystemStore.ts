import { create } from 'zustand';
import type { ConnectionState, Severity, SystemMetrics } from '@/types';

export interface LogEvent {
  id: string;
  timestamp: number;
  severity: Severity;
  source: string;
  message: string;
}

interface SystemState {
  connection: ConnectionState;
  source: 'live' | 'mock';
  metrics: SystemMetrics;
  events: LogEvent[];
  setConnection: (c: ConnectionState) => void;
  setSource: (s: 'live' | 'mock') => void;
  setMetrics: (patch: Partial<SystemMetrics>) => void;
  pushFps: (fps: number) => void;
  pushEvent: (e: Omit<LogEvent, 'id' | 'timestamp'>) => void;
}

const seedFps = Array.from({ length: 60 }, (_, i) =>
  Math.round(58 + Math.sin(i / 4) * 2 + (Math.random() - 0.5) * 1.2),
);

export const useSystemStore = create<SystemState>((set) => ({
  connection: 'offline',
  source: 'mock',
  metrics: {
    cpu: 62,
    gpu: 78,
    mem: 55,
    net: 38,
    fps: 60,
    fpsHistory: seedFps,
  },
  events: [
    {
      id: 'e0',
      timestamp: Date.now() - 30_000,
      severity: 'info',
      source: 'BRIDGE',
      message: '指挥中心已启动',
    },
  ],
  setConnection: (connection) => set({ connection }),
  setSource: (source) => set({ source }),
  setMetrics: (patch) => set((s) => ({ metrics: { ...s.metrics, ...patch } })),
  pushFps: (fps) =>
    set((s) => ({
      metrics: {
        ...s.metrics,
        fps,
        fpsHistory: [...s.metrics.fpsHistory.slice(1), fps],
      },
    })),
  pushEvent: (e) =>
    set((s) => ({
      events: [
        ...s.events,
        { ...e, id: `e${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now() },
      ].slice(-200),
    })),
}));
