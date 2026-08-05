import { redirect } from 'next/navigation';

/** Rota que apaga o cookie antes de devolver o usuário ao login. */
export const ROTA_SESSAO_ENCERRADA = '/api/sessao/encerrada';

/**
 * Trata `401` vindo da API em Server Components. Sessão substituída (o usuário
 * entrou em outro dispositivo) passa pela rota que **apaga o cookie** — sem isso o
 * login devolve para o dashboard e vira loop (C12). Qualquer outro 401 é sessão
 * inválida/expirada: vai direto para o login.
 *
 * Não faz nada quando a resposta não é 401 — o chamador segue com o seu próprio
 * tratamento de erro.
 */
export async function redirecionaSeSessaoInvalida(res: Response): Promise<void> {
  if (res.status !== 401) return;
  const body = (await res.json().catch(() => ({}))) as { code?: string };
  redirect(body.code === 'SESSION_REPLACED' ? ROTA_SESSAO_ENCERRADA : '/login');
}
