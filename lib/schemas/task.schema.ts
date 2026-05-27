import { z } from 'zod';
import { FREE } from '../limits';

export const TASK_TITLE_MAX = FREE.taskTitle;
export const TASK_DESCRIPTION_MAX = FREE.taskDescription;

export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Título obrigatório')
    .max(TASK_TITLE_MAX, `Máximo ${TASK_TITLE_MAX} caracteres`),
  description: z
    .string()
    .max(TASK_DESCRIPTION_MAX, `Máximo ${TASK_DESCRIPTION_MAX} caracteres`)
    .optional(),
});

export type TaskUpdateFormData = z.infer<typeof taskUpdateSchema>;
