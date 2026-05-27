import { z } from 'zod';
import { FREE } from '../limits';

export const BROADCAST_TITLE_MAX = FREE.broadcastTitle;
export const BROADCAST_BODY_MAX = FREE.broadcastBody;

export const broadcastSchema = z.object({
  title: z
    .string()
    .min(1, 'Título obrigatório')
    .max(BROADCAST_TITLE_MAX, `Máximo ${BROADCAST_TITLE_MAX} caracteres`),
  body: z
    .string()
    .min(1, 'Corpo obrigatório')
    .max(BROADCAST_BODY_MAX, `Máximo ${BROADCAST_BODY_MAX} caracteres`),
});

export type BroadcastFormData = z.infer<typeof broadcastSchema>;
