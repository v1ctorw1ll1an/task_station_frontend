'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { updateCompanySchema } from '@/lib/schemas/update-company.schema';

export interface UpdateCompanyActionState {
  error?: string;
  success?: boolean;
}

export async function updateCompanyAction(
  _prev: UpdateCompanyActionState,
  formData: FormData,
): Promise<UpdateCompanyActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const id = formData.get('id');
  if (!id || typeof id !== 'string') return { error: 'ID inválido' };

  const raw = {
    legalName: formData.get('legalName') || undefined,
    taxId: formData.get('taxId') || undefined,
  };

  const parsed = updateCompanySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/superadmin/empresas/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.message ?? 'Erro ao atualizar empresa' };
    }
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }

  revalidatePath('/superadmin/empresas');
  return { success: true };
}
