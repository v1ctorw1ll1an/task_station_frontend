import { z } from 'zod';
import { PASSWORD_MAX, PASSWORD_MIN } from '@/lib/limits';

export const NAME_MAX = 120;
export const PHONE_MAX = 20;
export const EMAIL_MAX = 254;
// Reexportados por compatibilidade: o número agora mora em lib/limits.ts, junto
// com o espelho do backend.
export { PASSWORD_MIN, PASSWORD_MAX };

export const updateProfileSchema = z
  .object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(NAME_MAX, `Máximo ${NAME_MAX} caracteres`).optional(),
    email: z.email('Email inválido').max(EMAIL_MAX, 'Email muito longo').optional(),
    phone: z.string().max(PHONE_MAX, `Máximo ${PHONE_MAX} caracteres`).optional().or(z.literal('')),
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `Mínimo ${PASSWORD_MIN} caracteres`)
      .max(PASSWORD_MAX, `Máximo ${PASSWORD_MAX} caracteres`)
      .optional()
      .or(z.literal('')),
    confirmPassword: z
      .string()
      .max(PASSWORD_MAX, `Máximo ${PASSWORD_MAX} caracteres`)
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) =>
      !data.newPassword || data.newPassword === data.confirmPassword,
    { message: 'As senhas não coincidem', path: ['confirmPassword'] },
  );

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
