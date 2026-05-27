import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.email('Email inválido').max(254, 'Email muito longo'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
