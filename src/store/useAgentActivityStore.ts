import { create } from 'zustand';
import type { Severity } from '@/types';

export type AgentCommandStatus = 'accepted' | 'running' | 'completed' | 'rejected' | 'unknown';

export interface AgentActivity {
  id: string;
  target: string;
  kind: string;
  status: AgentCommandStatus;
  taskId?: string;
  timestamp: number;
  summary: string;
  displayText: string;
  source: string;
}

export interface AgentNotification {
  id: string;
  timestamp: number;
  severity: Severity;
  target: string;
  kind: string;
  status: AgentCommandStatus;
  message: string;
}

interface AgentEventInput {
  severity?: Severity;
  source?: string;
  message: string;
  timestamp?: number;
  notify?: boolean;
}

export interface ParsedAgentEvent {
  status: AgentCommandStatus;
  target: string;
  kind: string;
  taskId?: string;
  summary: string;
}

interface AgentActivityState {
  activitiesByTarget: Record<string, AgentActivity>;
  notifications: AgentNotification[];
  aerialFireAlertActive: boolean;
  ingestEventLog: (event: AgentEventInput) => void;
  ingestReject: (payload: { id: string; target?: string; reason: string }) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const COMMAND_SOURCES = new Set(['SCENARIO', 'AGENT']);
const COMPLETE_VALUES = new Set(['completed', 'complete', 'success', 'succeeded', 'done', 'finished']);
const REJECT_VALUES = new Set(['rejected', 'reject', 'failed', 'failure', 'error']);
const RUNNING_VALUES = new Set(['running', 'active', 'executing', 'in_progress', 'progress']);
const ACCEPT_VALUES = new Set(['accepted', 'accept', 'queued', 'started', 'start']);
const FIELD_STATUS_KEYS = new Set(['status', 'state', 'result', 'phase']);
const IGNORED_KINDS = new Set(['UAV_HOLD']);

function normalizeStatus(value?: string): AgentCommandStatus {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return 'unknown';
  if (COMPLETE_VALUES.has(normalized)) return 'completed';
  if (REJECT_VALUES.has(normalized)) return 'rejected';
  if (RUNNING_VALUES.has(normalized)) return 'running';
  if (ACCEPT_VALUES.has(normalized)) return 'accepted';
  return 'unknown';
}

export function parseAgentEvent(message: string): ParsedAgentEvent | null {
  const tokens = message.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const firstTokenStatus = normalizeStatus(tokens[0]);
  const fields = new Map<string, string>();
  const looseTokens: string[] = [];

  for (const token of tokens.slice(1)) {
    const eq = token.indexOf('=');
    if (eq <= 0) {
      looseTokens.push(token);
      continue;
    }
    fields.set(token.slice(0, eq).toLowerCase(), token.slice(eq + 1));
  }

  const target = fields.get('target');
  const kind = fields.get('kind');
  if (!target || !kind) return null;

  let status = firstTokenStatus;
  if (status === 'unknown') {
    for (const key of FIELD_STATUS_KEYS) {
      const fieldStatus = normalizeStatus(fields.get(key));
      if (fieldStatus !== 'unknown') {
        status = fieldStatus;
        break;
      }
    }
  }
  if (status === 'unknown' && fields.get('done')?.toLowerCase() === 'true') {
    status = 'completed';
  }

  return {
    status,
    target,
    kind,
    taskId: looseTokens[0],
    summary: message,
  };
}

function readableTarget(target: string) {
  return target.replace('-', '');
}

function isReturnCommand(kind: string) {
  return /RETURN|RTB|RTL|BACK|HOME/i.test(kind);
}

function toReadableMessage(target: string, kind: string, status: AgentCommandStatus) {
  const name = readableTarget(target);

  if (status === 'rejected') return `${name} 指令被拒绝`;

  if (kind === 'UAV_PATROL') {
    if (status === 'completed') return `${name} 完成火情巡查`;
    return `${name} 正在巡查火情`;
  }

  if (kind === 'UAV_GOTO') {
    if (status === 'completed') return `${name} 发现火情，Agent调度计划生成中`;
    return `${name} 正在前往火情位置`;
  }

  if (kind === 'UGV_GOTO') {
    if (status === 'completed') return `${name} 已到达火灾地点`;
    return `${name} 正在赶往火灾地点`;
  }

  if (kind === 'UGV_EXTINGUISH') {
    if (status === 'completed') return '火情处置完成';
    return `${name} 正在灭火`;
  }

  if (isReturnCommand(kind)) {
    if (status === 'completed') return `${name} 完成返航`;
    return `${name} 正在返航`;
  }

  if (status === 'completed') return `${name} 已完成 ${kind}`;
  if (status === 'running' || status === 'accepted') return `${name} 正在执行 ${kind}`;
  return `${name} 收到 ${kind}`;
}

function eventSeverity(status: AgentCommandStatus, kind: string): Severity {
  if (status === 'rejected') return 'danger';
  if (status === 'completed' && kind === 'UAV_GOTO') return 'danger';
  if (status === 'completed' && kind === 'UGV_EXTINGUISH') return 'ok';
  if (status === 'completed') return 'ok';
  if (kind === 'UAV_GOTO' || kind === 'UAV_PATROL' || kind === 'UGV_EXTINGUISH') return 'warn';
  return 'info';
}

function shouldNotify(status: AgentCommandStatus, kind: string) {
  return (
    status === 'rejected' ||
    status === 'completed' ||
    kind === 'UAV_PATROL' ||
    kind === 'UAV_GOTO' ||
    kind === 'UGV_GOTO' ||
    kind === 'UGV_EXTINGUISH' ||
    isReturnCommand(kind)
  );
}

export function agentStatusLabel(status: AgentCommandStatus) {
  if (status === 'accepted') return '已接收';
  if (status === 'running') return '执行中';
  if (status === 'completed') return '完成';
  if (status === 'rejected') return '拒绝';
  return '更新';
}

export function formatAgentEventLogMessage(source: string | undefined, message: string) {
  const normalizedSource = (source ?? 'AGENT').toUpperCase();
  if (!COMMAND_SOURCES.has(normalizedSource)) return null;

  const parsed = parseAgentEvent(message);
  if (!parsed || IGNORED_KINDS.has(parsed.kind)) return null;

  return {
    ...parsed,
    targetLabel: readableTarget(parsed.target),
    statusLabel: agentStatusLabel(parsed.status),
    displayText: toReadableMessage(parsed.target, parsed.kind, parsed.status),
  };
}

export const useAgentActivityStore = create<AgentActivityState>((set, get) => ({
  activitiesByTarget: {},
  notifications: [],
  aerialFireAlertActive: false,

  ingestEventLog: (event) => {
    const source = (event.source ?? 'AGENT').toUpperCase();
    if (!COMMAND_SOURCES.has(source)) return;

    const parsed = parseAgentEvent(event.message);
    if (!parsed) return;
    if (IGNORED_KINDS.has(parsed.kind)) return;

    const timestamp = event.timestamp ?? Date.now();
    const previous = get().activitiesByTarget[parsed.target];
    if (previous && previous.timestamp > timestamp) return;

    const id = `agent-${timestamp}-${Math.random().toString(36).slice(2, 6)}`;
    const displayText = toReadableMessage(parsed.target, parsed.kind, parsed.status);
    const activity: AgentActivity = {
      id,
      target: parsed.target,
      kind: parsed.kind,
      status: parsed.status,
      taskId: parsed.taskId,
      timestamp,
      summary: parsed.summary,
      displayText,
      source,
    };

    const isFireDetected =
      parsed.status === 'completed' && parsed.kind === 'UAV_GOTO' && parsed.target.startsWith('UAV-');
    const isFireCleared =
      parsed.status === 'completed' &&
      parsed.kind === 'UGV_EXTINGUISH' &&
      parsed.target.startsWith('UGV-');

    const nextState: Partial<AgentActivityState> = {
      activitiesByTarget: {
        ...get().activitiesByTarget,
        [parsed.target]: activity,
      },
    };

    if (isFireDetected) nextState.aerialFireAlertActive = true;
    if (isFireCleared) nextState.aerialFireAlertActive = false;

    if (event.notify !== false && shouldNotify(parsed.status, parsed.kind)) {
      nextState.notifications = [
        {
          id,
          timestamp,
          severity: eventSeverity(parsed.status, parsed.kind),
          target: parsed.target,
          kind: parsed.kind,
          status: parsed.status,
          message: displayText,
        },
      ];
    }

    set(nextState);
  },

  ingestReject: ({ id, target, reason }) => {
    if (!target) return;
    const timestamp = Date.now();
    const activityId = `reject-${timestamp}-${Math.random().toString(36).slice(2, 6)}`;
    const previous = get().activitiesByTarget[target];
    const kind = previous?.kind ?? 'AGENT_COMMAND';
    const displayText = toReadableMessage(target, kind, 'rejected');
    const activity: AgentActivity = {
      id: activityId,
      target,
      kind,
      status: 'rejected',
      taskId: id,
      timestamp,
      summary: reason,
      displayText,
      source: 'AGENT',
    };
    const notification: AgentNotification = {
      id: activityId,
      timestamp,
      severity: 'danger',
      target,
      kind,
      status: 'rejected',
      message: displayText,
    };
    set((state) => ({
      activitiesByTarget: {
        ...state.activitiesByTarget,
        [target]: activity,
      },
      notifications: [notification],
    }));
  },

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
