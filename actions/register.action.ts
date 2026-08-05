'use server';

import { registerSchema } from '@/lib/schemas/register.schema';

export interface RegisterActionState {
  error?: string;
  success?: boolean;
  email?: string;
}

export async function registerAction(
  _prev: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const raw = {
    legalName: formData.get('legalName'),
    taxId: formData.get('taxId'),
    ownerName: formData.get('ownerName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/register`, {
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
