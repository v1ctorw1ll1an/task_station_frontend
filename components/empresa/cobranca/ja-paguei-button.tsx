'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { conferirPagamentoAction } from '@/actions/empresa/billing.action';
import { Button } from '@/components/ui/button';

/**
 * "Já paguei" — para quem pagou e não quer ficar olhando a tela até o webhook do
 * Asaas chegar. O clique força a conferência no provedor e:
 *
 * - **identificou** → recarrega a página (o plano já entra ativo no render novo);
 * - **não identificou** → diz isso com todas as letras e deixa tentar de novo.
 *   Pix e cartão levam de segundos a alguns minutos para compensar, então
 *   "não identificado até o momento" é a informação honesta — não é erro.
 */
export function JaPagueiButton({
  companyId,
  variant = 'outline',
}: {
  companyId: string;
  variant?: 'default' | 'outline';
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [resultado, setResultado] = useState<'nao_identificado' | 'confirmado' | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function conferir() {
    setErro(null);
    setResultado(null);
    start(async () => {
      const r = await conferirPagamentoAction(companyId);
      if (r.error) {
        setErro(r.error);
        return;
      }
      if (r.pago) {
        // Mostra a confirmação antes de recarregar: sem isso o refresh parece um
        // clique que não fez nada, já que a tela nova é a de plano ativo.
        setResultado('confirmado');
        router.refresh();
        return;
      }
      setResultado('nao_identificado');
    });
  }

  return (
    <div className="space-y-2">
      <Button variant={variant} size="sm" disabled={pending} onClick={conferir}>
        <RefreshCw className={`mr-1 h-4 w-4 ${pending ? 'animate-spin' : ''}`} />
        {pending ? 'Conferindo...' : 'Já paguei'}
      </Button>

      {erro && <p className="text-xs text-destructive">{erro}</p>}

      {resultado === 'nao_identificado' && (
        <p className="flex items-start gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/10 px-2.5 py-2 text-xs">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>Pagamento não identificado até o momento.</strong> Pode levar alguns minutos
            para o banco confirmar. Tente de novo em instantes — assim que cair, o acesso é
            liberado automaticamente, mesmo sem você conferir.
          </span>
        </p>
      )}

      {resultado === 'confirmado' && (
        <p className="flex items-center gap-1.5 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-2 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Pagamento confirmado! Atualizando a tela...
        </p>
      )}
    </div>
  );
}
