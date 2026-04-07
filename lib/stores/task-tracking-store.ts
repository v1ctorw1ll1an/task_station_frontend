import { create } from 'zustand';

export interface ActiveSession {
  id: string;
  taskId: string;
  taskTitle: string;
  taskNumber: number | null;
  projectId: string;
  projectName: string;
  workspaceId: string;
  workspaceName: string;
  userId: string;
  userName: string;
  userPhotoUrl: string | null;
  status: 'running' | 'paused';
  totalSeconds: number;
  resumedAt: string | null; // ISO string — only set when status === 'running'
}

// Raw session shape returned from the backend (includes nested relations)
export interface RawSession {
  id: string;
  taskId: string;
  userId: string;
  status: string;
  totalSeconds: number;
  resumedAt: string | null;
  startedAt: string;
  task: {
    id: string;
    title: string;
    taskNumber: number | null;
    project: {
      id: string;
      name: string;
      workspaceId: string;
      workspace: { id: string; name: string; companyId?: string };
    };
  };
  user: { id: string; name: string; photoUrl: string | null };
}

interface TaskTrackingStore {
  sessions: ActiveSession[];
  /** Returns total elapsed seconds to display (accumulated + current segment if running) */
  getDisplaySeconds: (sessionId: string) => number;
  setSessions: (sessions: ActiveSession[]) => void;
  applySessionStarted: (session: ActiveSession) => void;
  applySessionPaused: (sessionId: string, totalSeconds: number) => void;
  applySessionResumed: (sessionId: string, resumedAt: string) => void;
  applySessionStopped: (sessionId: string) => void;
}

export const useTaskTrackingStore = create<TaskTrackingStore>((set, get) => ({
  sessions: [],

  getDisplaySeconds(sessionId) {
    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session) return 0;
    if (session.status === 'running' && session.resumedAt) {
      const elapsed = Math.floor((Date.now() - new Date(session.resumedAt).getTime()) / 1000);
      return session.totalSeconds + elapsed;
    }
    return session.totalSeconds;
  },

  setSessions(sessions) {
    set({ sessions });
  },

  applySessionStarted(session) {
    set((state) => ({
      sessions: [...state.sessions.filter((s) => s.id !== session.id), session],
    }));
  },

  applySessionPaused(sessionId, totalSeconds) {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, status: 'paused', totalSeconds, resumedAt: null } : s,
      ),
    }));
  },

  applySessionResumed(sessionId, resumedAt) {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, status: 'running', resumedAt } : s,
      ),
    }));
  },

  applySessionStopped(sessionId) {
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
    }));
  },
}));

/** Convert a raw backend session to the ActiveSession store shape */
export function rawToActiveSession(raw: RawSession): ActiveSession {
  return {
    id: raw.id,
    taskId: raw.taskId,
    taskTitle: raw.task.title,
    taskNumber: raw.task.taskNumber,
    projectId: raw.task.project.id,
    projectName: raw.task.project.name,
    workspaceId: raw.task.project.workspaceId,
    workspaceName: raw.task.project.workspace?.name ?? '',
    userId: raw.userId,
    userName: raw.user.name,
    userPhotoUrl: raw.user.photoUrl,
    status: raw.status as 'running' | 'paused',
    totalSeconds: raw.totalSeconds,
    resumedAt: raw.resumedAt ?? null,
  };
}
