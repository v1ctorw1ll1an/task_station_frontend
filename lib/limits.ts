/**
 * Espelha backend/src/common/limits.ts.
 *
 * Manter os dois em sincronia: o backend valida no DTO (defesa real); o
 * frontend usa esses mesmos números para o CharCounter e o zod schema
 * (feedback imediato + payload menor para o servidor).
 *
 * Quando virar tier por usuário, expor um `useLimits()` hook que lê o plano
 * do contexto de auth e devolve `LIMITS[plan]`.
 */
export type Plan = 'free' | 'pro';

interface TierLimits {
  taskTitle: number;
  taskDescription: number;
  comment: number;
  checklistItem: number;
  broadcastTitle: number;
  broadcastBody: number;
  stickyNote: number;
  entityName: number;
  mentionsPerComment: number;
  guestsPerTask: number;
}

export const LIMITS: Record<Plan, TierLimits> = {
  free: {
    taskTitle: 120,
    taskDescription: 1_000,
    comment: 250,
    checklistItem: 120,
    broadcastTitle: 120,
    broadcastBody: 500,
    stickyNote: 255,
    entityName: 80,
    mentionsPerComment: 10,
    guestsPerTask: 20,
  },
  pro: {
    taskTitle: 255,
    taskDescription: 10_000,
    comment: 2_000,
    checklistItem: 500,
    broadcastTitle: 200,
    broadcastBody: 5_000,
    stickyNote: 1_000,
    entityName: 120,
    mentionsPerComment: 25,
    guestsPerTask: 100,
  },
};

export const FREE = LIMITS.free;
