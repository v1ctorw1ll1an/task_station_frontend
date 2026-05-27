import { z } from 'zod';
import { FREE } from '../limits';

export const COMMENT_MAX = FREE.comment;

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comentário não pode estar vazio')
    .max(COMMENT_MAX, `Máximo ${COMMENT_MAX} caracteres`),
});

export type CommentFormData = z.infer<typeof commentSchema>;
