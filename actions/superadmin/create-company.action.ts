'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { createCompanySchema } from '@/lib/schemas/create-company.schema';

export interface CreateCompanyActionState {
  error?: string;
  success?: boolean;
}

export async function createCompanyAction(
  _prev: CreateCompanyActionState,
  formData: FormData,
): Promise<CreateCompanyActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const raw = {
    legalName: formData.get('legalName'),
    taxId: formData.get('taxId'),
    adminName: formData.get('adminName'),
    adminEmail: formData.get('adminEmail'),
  };

  const parsed = createCompanySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/superadmin/empresas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao criar empresa' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath('/superadmin/empresas');
  return { success: true };
}
