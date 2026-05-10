import { create } from 'zustand';
import type {
  CityMetrics,
  CommandRecord,
  ConnectionState,
  SystemMetrics,
  UavTelemetry,
  UgvTelemetry,
} from '@/types';

interface MockState {
  connection: ConnectionState;
  uav: UavTelemetry;
  ugv: UgvTelemetry;
  city: CityMetrics;
  system: SystemMetrics;
  commands: CommandRecord[];
  pushCommand: (record: Omit<CommandRecord, 'id' | 'timestamp'>) => void;
  tick: () => void;
}

const seedFps = Array.from({ length: 60 }, (_, i) =>
  Math.round(58 + Math.sin(i / 4) * 2 + (Math.random() - 0.5) * 1.2),
);

export const useMockStore = create<MockState>((set, get) => ({
  connection: 'live',
  uav: {
    id: 'UAV-01',
    altitude: 128.4,
    speed: 32.1,
    heading: 47,
    battery: 87,
    gps: { lat: 31.2304, lng: 121.4737 },
    link: { latency: 12, quality: 0.92 },
  },
  ugv: {
    id: 'UGV-02',
    speed: 28.6,
    heading: 312,
    road: '中环路 · E 段',
    obstacle: 'safe',
    battery: 73,
    link: { latency: 18, quality: 0.88 },
  },
  city: {
    vehicles: 1284,
    pedestrians: 45621,
    intersections: 'normal',
    aqi: 35,
    alerts: 3,
  },
  system: {
    cpu: 62,
    gpu: 78,
    mem: 55,
    net: 38,
    fps: 60,
    fpsHistory: seedFps,
  },
  commands: [
    {
      id: 'c0',
      timestamp: Date.now() - 60_000,
      direction: 'system',
      target: 'SYS',
      text: '指挥中心已启动,等待指令输入',
    },
    {
      id: 'c1',
      timestamp: Date.now() - 42_000,
      direction: 'out',
      target: 'ALL',
      text: 'patrol start',
    },
    {
      id: 'c2',
      timestamp: Date.now() - 41_700,
      direction: 'ack',
      target: 'UAV-01',
      text: 'acknowledged',
      latencyMs: 230,
    },
    {
      id: 'c3',
      timestamp: Date.now() - 41_500,
      direction: 'ack',
      target: 'UGV-02',
      text: 'acknowledged',
      latencyMs: 180,
    },
    {
      id: 'c4',
      timestamp: Date.now() - 18_000,
      direction: 'warn',
      target: 'UAV-03',
      text: 'weak signal · -82 dBm',
    },
  ],

  pushCommand: (record) => {
    const next: CommandRecord = {
      ...record,
      id: `c${Date.now()}`,
      timestamp: Date.now(),
    };
    set((s) => ({ commands: [...s.commands, next].slice(-200) }));
  },

  tick: () => {
    const s = get();
    const drift = (v: number, range: number, min = 0, max = 100) =>
      Math.max(min, Math.min(max, v + (Math.random() - 0.5) * range));

    set({
      uav: {
        ...s.uav,
        altitude: drift(s.uav.altitude, 0.6, 80, 180),
        speed: drift(s.uav.speed, 0.4, 0, 60),
        battery: Math.max(0, s.uav.battery - 0.01),
        link: { ...s.uav.link, latency: drift(s.uav.link.latency, 2, 5, 60) },
      },
      ugv: {
        ...s.ugv,
        speed: drift(s.ugv.speed, 0.4, 0, 60),
        heading: drift(s.ugv.heading, 1, 0, 360),
        link: { ...s.ugv.link, latency: drift(s.ugv.link.latency, 2, 5, 60) },
      },
      city: {
        ...s.city,
        vehicles: Math.round(drift(s.city.vehicles, 6, 800, 1800)),
        pedestrians: Math.round(drift(s.city.pedestrians, 80, 30000, 60000)),
      },
      system: {
        ...s.system,
        cpu: drift(s.system.cpu, 2, 20, 95),
        gpu: drift(s.system.gpu, 2, 30, 98),
        mem: drift(s.system.mem, 1, 30, 90),
        net: drift(s.system.net, 3, 5, 90),
        fps: Math.round(drift(s.system.fps, 1, 50, 62)),
        fpsHistory: [...s.system.fpsHistory.slice(1), Math.round(drift(s.system.fps, 1, 50, 62))],
      },
    });
  },
}));
