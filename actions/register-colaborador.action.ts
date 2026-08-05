'use server';

import { registerColaboradorSchema } from '@/lib/schemas/register-colaborador.schema';

export interface RegisterColaboradorActionState {
  error?: string;
  success?: boolean;
  email?: string;
}

export async function registerColaboradorAction(
  _prev: RegisterColaboradorActionState,
  formData: FormData,
): Promise<RegisterColaboradorActionState> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
  };

  const parsed = registerColaboradorSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/register-colaborador`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      if (res.status === 404) {
        return { error: 'O cadastro está indisponível no momento.' };
      }
      const message = Array.isArray(body.message) ? body.message[0] : body.message;
      return { error: message ?? 'Não foi possível concluir o cadastro. Tente novamente.' };
    }

    return { success: true, email: parsed.data.email };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
