'use client';

import { createContext, useContext } from 'react';

interface BillingMode {
  /** Empresa bloqueada por cobrança: o app roda em consulta, sem criar/editar. */
  readOnly: boolean;
  companyId: string;
}

const Ctx = createContext<BillingMode>({ readOnly: false, companyId: '' });

/** Texto único do `title` dos controles desabilitados — mesma explicação em todo lugar. */
export const MSG_SOMENTE_LEITURA =
  'Assinatura vencida: o TaskDY está em somente leitura. Regularize a cobrança para voltar a editar.';

/**
 * Modo de cobrança da empresa para a árvore de componentes. Quando a assinatura
 * vence, o app **continua visível** — o time consulta tudo — e só a escrita é
 * bloqueada. A garantia dura é o backend (`BillingGateGuard` + `assertNotBlocked`);
 * isto aqui existe para o usuário não bater numa parede sem entender o motivo.
 */
export function BillingModeProvider({
  readOnly,
  companyId,
  children,
}: {
  readOnly: boolean;
  companyId: string;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={{ readOnly, companyId }}>{children}</Ctx.Provider>;
}

/** `true` quando a empresa está em somente-leitura por cobrança. */
export function useReadOnly(): boolean {
  return useContext(Ctx).readOnly;
}

export function useBillingMode(): BillingMode {
  return useContext(Ctx);
}
