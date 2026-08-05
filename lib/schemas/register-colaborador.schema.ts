import { z } from 'zod';

/**
 * Auto-cadastro de colaborador: cria só a conta da pessoa, sem empresa. Ela entra
 * em uma ou mais empresas por convite. Espelha o `RegisterColaboradorDto` do backend.
 */
export const registerColaboradorSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(120, 'Máximo 120 caracteres'),
  email: z.string().email('Email inválido').max(254, 'Email muito longo'),
});

export type RegisterColaboradorFormData = z.infer<typeof registerColaboradorSchema>;
