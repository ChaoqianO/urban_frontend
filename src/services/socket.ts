import { io, type Socket } from 'socket.io-client';
import { useSystemStore } from '@/store/useSystemStore';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { useCommandStore } from '@/store/useCommandStore';
import { useAgentActivityStore } from '@/store/useAgentActivityStore';

let socket: Socket | null = null;
let connectedAt = 0;
let suppressReplayUntil = 0;
let replayDone = false;

const INITIAL_REPLAY_SUPPRESS_MS = 2500;

function normalizeEventTimestamp(timestamp?: number | string) {
  if (typeof timestamp === 'number') {
    return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  }
  if (typeof timestamp === 'string') {
    const parsed = Date.parse(timestamp);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function isLikelyReplay(eventTimestamp: number | undefined, now: number) {
  // Explicit signal from backend wins.
  if (replayDone) return false;
  // Real timestamp lets us decide precisely.
  if (typeof eventTimestamp === 'number' && Number.isFinite(eventTimestamp)) {
    return eventTimestamp < connectedAt - 1000;
  }
  // No timestamp: stay conservative inside the post-connect window so that
  // replayed events without timing info don't pop as fresh notifications.
  return now < suppressReplayUntil;
}

export interface ConnectOptions {
  url: string;
  /** When true, do not bind handlers — useful for one-shot pings. */
  passive?: boolean;
}

export function getSocket(): Socket | null {
  return socket;
}

export function connect(opts: ConnectOptions) {
  if (socket) return socket;
  const sys = useSystemStore.getState();
  sys.setConnection('reconnecting');

  socket = io(opts.url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 6000,
    autoConnect: true,
  });

  if (opts.passive) return socket;

  socket.on('connect', () => {
    connectedAt = Date.now();
    suppressReplayUntil = connectedAt + INITIAL_REPLAY_SUPPRESS_MS;
    replayDone = false;
    useAgentActivityStore.getState().resetForReconnect();
    useSystemStore.getState().setMetrics({ cpu: 0, gpu: 0, mem: 0, net: 0, fps: 0 });
    useSystemStore.getState().setConnection('live');
    useSystemStore.getState().setSource('live');
    useSystemStore.getState().pushEvent({
      severity: 'ok',
      source: 'BRIDGE',
      message: `已连接 ${opts.url}`,
    });
  });

  socket.on('disconnect', (reason) => {
    useSystemStore.getState().setConnection('reconnecting');
    useSystemStore.getState().pushEvent({
      severity: 'warn',
      source: 'BRIDGE',
      message: `连接断开 · ${reason}`,
    });
  });

  socket.on('connect_error', (err) => {
    useSystemStore.getState().setConnection('reconnecting');
    useSystemStore.getState().pushEvent({
      severity: 'danger',
      source: 'BRIDGE',
      message: `连接错误 · ${err.message}`,
    });
  });

  socket.on('state_update', (payload: Record<string, unknown>) => {
    useTelemetryStore.getState().ingest(payload);
  });

  socket.on(
    'system_metrics',
    (m: { cpu?: number; gpu?: number; mem?: number; net?: number; fps?: number }) => {
      const store = useSystemStore.getState();
      store.setMetrics({
        cpu: m.cpu ?? 0,
        gpu: m.gpu ?? 0,
        mem: m.mem ?? 0,
        net: m.net ?? 0,
      });
      if (typeof m.fps === 'number') store.pushFps(m.fps);
    },
  );

  socket.on('replay_done', () => {
    replayDone = true;
  });

  socket.on(
    'event_log',
    (e: {
      severity?: 'info' | 'ok' | 'warn' | 'danger';
      source?: string;
      message: string;
      timestamp?: number | string;
    }) => {
      const eventTimestamp = normalizeEventTimestamp(e.timestamp);
      const event = {
        severity: e.severity ?? 'info',
        source: e.source ?? 'AGENT',
        message: e.message,
        timestamp: eventTimestamp,
        notify: !isLikelyReplay(eventTimestamp, Date.now()),
      };
      useSystemStore.getState().pushEvent({
        severity: event.severity,
        source: event.source,
        message: event.message,
        timestamp: event.timestamp,
      });
      useAgentActivityStore.getState().ingestEventLog(event);
    },
  );

  socket.on('agent_ack', (a: { id: string; target?: string; latency_ms?: number }) => {
    useCommandStore.getState().ack(a.id, a.latency_ms ?? 0, a.target);
  });

  socket.on('agent_reject', (a: { id: string; reason: string; target?: string }) => {
    useCommandStore.getState().reject(a.id, a.reason, a.target);
    useAgentActivityStore.getState().ingestReject(a);
  });

  return socket;
}

export function disconnect() {
  socket?.disconnect();
  socket = null;
  useSystemStore.getState().setConnection('offline');
  useSystemStore.getState().setSource('mock');
}

export function emitCommand(payload: {
  id: string;
  target: string;
  priority: string;
  text: string;
}) {
  if (!socket || !socket.connected) return false;
  socket.emit('agent_command', payload);
  return true;
}
