'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

// NOTA: em um arquivo 'use server', todo export precisa ser uma função async.
// Por isso a interface abaixo NÃO é exportada e as actions são todas `async`.
interface FinanceiroActionState {
  error?: string;
  success?: boolean;
}

async function postAction(
  companyId: string,
  path: string,
  body: Record<string, unknown>,
): Promise<FinanceiroActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/superadmin/financeiro/empresas/${companyId}/${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      const message = Array.isArray(b.message) ? b.message[0] : b.message;
      return { error: message ?? 'Erro ao executar a operação' };
    }
    revalidatePath(`/superadmin/financeiro/${companyId}`);
    revalidatePath('/superadmin/financeiro');
    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}

export async function adjustSeatsAction(companyId: string, total: number) {
  return postAction(companyId, 'assentos', { total });
}

export async function setCourtesyAction(companyId: string, grant: boolean) {
  return postAction(companyId, 'cortesia', { grant });
}

export async function extendTrialAction(companyId: string, endsAt: string) {
  return postAction(companyId, 'trial', { endsAt });
}

export async function cancelSubscriptionAction(companyId: string, atPeriodEnd: boolean) {
  return postAction(companyId, 'cancelar', { atPeriodEnd });
}

export async function setReadonlyAction(companyId: string, locked: boolean) {
  return postAction(companyId, 'readonly', { locked });
}

/**
 * Suspensão TOTAL (fraude/abuso/ordem judicial): fecha a porta da empresa, nem
 * leitura. Diferente do somente-leitura, que deixa o time seguir consultando.
 */
export async function suspendAccessAction(
  companyId: string,
  suspended: boolean,
  motivo?: string,
) {
  return postAction(companyId, 'suspender', { suspended, motivo });
}

/**
 * Reprocessa um evento de webhook do Asaas que ficou `failed`/`dead` (ou reaplica um
 * já processado). É idempotente no backend — não duplica cobrança nem ativação.
 */
export async function reprocessWebhookAction(id: string): Promise<FinanceiroActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessão expirada' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/api/v1/superadmin/financeiro/webhooks/${id}/reprocessar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      const message = Array.isArray(b.message) ? b.message[0] : b.message;
      return { error: message ?? 'Erro ao reprocessar o evento' };
    }
    revalidatePath('/superadmin/financeiro/webhooks');
    return { success: true };
  } catch {
    return { error: 'Erro ao conectar com o servidor' };
  }
}
