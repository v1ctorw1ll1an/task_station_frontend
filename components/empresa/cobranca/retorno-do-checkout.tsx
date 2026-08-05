'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { conferirPagamentoAction } from '@/actions/empresa/billing.action';

type Resultado = 'sucesso' | 'cancelado' | 'expirado';

/**
 * A volta da página de pagamento do Asaas.
 *
 * O provedor redireciona para cá com `?checkout=sucesso|cancelado|expirado`. No sucesso
 * não esperamos o webhook: disparamos a mesma conferência do botão "Já paguei", que
 * bate no Asaas e ativa o plano na hora. É o que evita o cliente voltar de um pagamento
 * aprovado e ver a tela dizendo que ele não assinou.
 *
 * A URL é limpa depois, para um F5 não repetir a conferência (nem manter o aviso preso
 * na tela).
 */
export function RetornoDoCheckout({
  companyId,
  resultado,
}: {
  companyId: string;
  resultado: Resultado;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<'conferindo' | 'confirmado' | 'aguardando'>(
    resultado === 'sucesso' ? 'conferindo' : 'aguardando',
  );
  // StrictMode monta duas vezes em dev; conferir duas vezes bateria no Asaas à toa.
  const jaConferiu = useRef(false);

  useEffect(() => {
    const limpar = () => router.replace(`/empresa/${companyId}/cobranca`, { scroll: false });

    if (resultado !== 'sucesso') {
      const t = setTimeout(limpar, 8_000);
      return () => clearTimeout(t);
    }
    if (jaConferiu.current) return;
    jaConferiu.current = true;

    void conferirPagamentoAction(companyId).then((r) => {
      setEstado(r.pago ? 'confirmado' : 'aguardando');
      limpar();
      router.refresh();
    });
  }, [companyId, resultado, router]);

  if (resultado === 'sucesso') {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm">
        {estado === 'conferindo' ? (
          <>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            Confirmando seu pagamento com o Asaas…
          </>
        ) : estado === 'confirmado' ? (
          <>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Pagamento confirmado. Tudo liberado!
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Pagamento recebido. A confirmação do banco costuma levar alguns minutos — assim que
            cair, o plano é ativado sozinho.
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      {resultado === 'cancelado'
        ? 'Pagamento cancelado. Nada foi cobrado — você pode tentar de novo quando quiser.'
        : 'A página de pagamento expirou. Nada foi cobrado; comece de novo para gerar outra.'}
    </div>
  );
}
