'use server';

import { forgotPasswordSchema } from '@/lib/schemas/forgot-password.schema';

export interface ForgotPasswordActionState {
  error?: string;
  success?: boolean;
}

export async function forgotPasswordAction(
  _prev: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const raw = { email: formData.get('email') };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    await fetch(`${apiUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  // Sempre retorna sucesso — não revela se o email existe ou não
  return { success: true };
}
