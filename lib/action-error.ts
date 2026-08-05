export interface ActionError {
  message: string;
  /** true quando o erro é o gate de cobrança (empresa bloqueada por trial/assinatura). */
  blocked?: boolean;
  /**
   * true quando não há usuário livre no plano. A mensagem manda contratar, então a
   * tela que a exibe deve oferecer o caminho para os planos — menos onde quem lê não
   * é admin da empresa (aceitar convite, por exemplo).
   */
  seatLimit?: boolean;
}

/**
 * Extrai uma mensagem de erro amigável do corpo de uma resposta de API,
 * reconhecendo os `code` estáveis do backend. Use nas server actions de mutação
 * para uma mensagem consistente ao usuário.
 */
export function extractActionError(body: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): ActionError {
  const b = (body ?? {}) as { message?: string | string[]; code?: string };
  const raw = Array.isArray(b.message) ? b.message[0] : b.message;
  if (b.code === 'COMPANY_BLOCKED') {
    return {
      message: raw ?? 'Acesso bloqueado por cobrança. Regularize para voltar a editar.',
      blocked: true,
    };
  }
  if (b.code === 'SEAT_LIMIT') {
    return {
      message: raw ?? 'Não há usuários disponíveis no plano.',
      seatLimit: true,
    };
  }
  return { message: raw ?? fallback };
}
