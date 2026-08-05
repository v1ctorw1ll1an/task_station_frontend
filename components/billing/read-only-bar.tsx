'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';

/**
 * Barra de somente-leitura: a empresa perdeu a assinatura, mas continua com os
 * dados à vista. Fica fixa no topo enquanto durar o bloqueio, com o caminho para
 * regularizar e para levar os dados embora — suspender o serviço é legítimo,
 * reter o dado do cliente sem saída não é.
 */
export function ReadOnlyBar({
  companyId,
  isAdmin,
  reason,
}: {
  companyId: string;
  isAdmin: boolean;
  reason: 'trial_ended' | 'subscription_expired' | 'admin_locked';
}) {
  const pathname = usePathname();
  const naTelaDeCobranca = pathname?.endsWith('/cobranca');
  // Limitação administrativa não se resolve pagando — some o CTA de cobrança.
  const administrativo = reason === 'admin_locked';

  const texto = administrativo
    ? 'Acesso limitado pela administração do TaskDY — somente leitura.'
    : reason === 'trial_ended'
      ? 'Seu teste grátis terminou — o TaskDY está em somente leitura.'
      : 'Assinatura vencida — o TaskDY está em somente leitura.';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm">
      <Lock className="h-4 w-4 shrink-0 text-amber-600" />
      <span className="min-w-0 flex-1">
        {texto}{' '}
        <span className="text-muted-foreground">
          Você continua consultando tudo e pode apagar o que não precisa mais; para voltar a criar e
          editar,{' '}
          {administrativo
            ? 'fale com o suporte'
            : isAdmin
              ? 'regularize a cobrança'
              : 'peça ao administrador para regularizar'}
          .
        </span>
      </span>
      {isAdmin && !administrativo && !naTelaDeCobranca && (
        <Link
          href={`/empresa/${companyId}/cobranca`}
          className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
        >
          Regularizar
        </Link>
      )}
      {isAdmin && (
        <a
          href={`/api/files/billing/empresa/${companyId}/exportar?formato=json`}
          className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
        >
          Exportar meus dados
        </a>
      )}
    </div>
  );
}
