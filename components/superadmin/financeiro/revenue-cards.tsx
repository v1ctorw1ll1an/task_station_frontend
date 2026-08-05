import Link from 'next/link';
import { AlertTriangle, CalendarClock, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCents, formatDate, METHOD_LABELS } from '@/components/superadmin/financeiro/format';

export interface RevenueSummary {
  mrrCents: number;
  ativas: number;
  inadimplencia: { count: number; mrrEmRiscoCents: number };
  recebidoNoMes: { totalCents: number; count: number };
  aReceber: { totalCents: number; count: number };
  trialsTerminando: number;
  canceladosNoMes: number;
  proximasRenovacoes: {
    companyId: string;
    legalName: string;
    method: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    valorCents: number;
  }[];
}

/**
 * Os números que faltavam para operar a cobrança: antes só existia a lista empresa a
 * empresa. MRR normaliza o anual por 12 — sem isso um cliente anual pareceria valer
 * doze mensais no mês em que pagou.
 */
export function RevenueCards({ resumo }: { resumo: RevenueSummary | null }) {
  if (!resumo) {
    return (
      <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
        Não foi possível carregar o resumo financeiro agora.
      </p>
    );
  }

  const emRisco = resumo.inadimplencia.count > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica
          icone={<TrendingUp className="h-4 w-4" />}
          rotulo="MRR"
          valor={formatCents(resumo.mrrCents)}
          nota={`${resumo.ativas} assinatura(s) ativa(s) · anual dividido por 12`}
        />
        <Metrica
          icone={<Wallet className="h-4 w-4" />}
          rotulo="Recebido no mês"
          valor={formatCents(resumo.recebidoNoMes.totalCents)}
          nota={`${resumo.recebidoNoMes.count} cobrança(s) paga(s)`}
        />
        <Metrica
          icone={<CalendarClock className="h-4 w-4" />}
          rotulo="A receber"
          valor={formatCents(resumo.aReceber.totalCents)}
          nota={`${resumo.aReceber.count} cobrança(s) em aberto`}
        />
        <Metrica
          icone={<AlertTriangle className="h-4 w-4" />}
          rotulo="Inadimplência"
          valor={formatCents(resumo.inadimplencia.mrrEmRiscoCents)}
          nota={`${resumo.inadimplencia.count} empresa(s) em atraso ou bloqueada(s)`}
          alerta={emRisco}
        />
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          Trials terminando em 7 dias: <strong>{resumo.trialsTerminando}</strong>
        </span>
        <span>
          Cancelamentos no mês: <strong>{resumo.canceladosNoMes}</strong>
        </span>
      </div>

      {resumo.proximasRenovacoes.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">Renovações nos próximos 30 dias</p>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="hidden sm:table-cell">Plano</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumo.proximasRenovacoes.map((r) => (
                    <TableRow key={r.companyId}>
                      <TableCell className="text-sm">
                        <Link
                          href={`/superadmin/financeiro/${r.companyId}`}
                          className="hover:underline"
                        >
                          {r.legalName}
                        </Link>
                        {/* Renovação agendada para cancelar não é receita futura. */}
                        {r.cancelAtPeriodEnd && (
                          <span className="ml-2 text-xs text-destructive">cancela</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {r.method ? (METHOD_LABELS[r.method] ?? r.method) : '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(r.currentPeriodEnd)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCents(r.valorCents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Metrica({
  icone,
  rotulo,
  valor,
  nota,
  alerta,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
  nota: string;
  alerta?: boolean;
}) {
  return (
    <Card className={alerta ? 'border-destructive/50' : undefined}>
      <CardContent className="pt-6">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icone}
          {rotulo}
        </p>
        <p className={`mt-1 text-2xl font-semibold ${alerta ? 'text-destructive' : ''}`}>{valor}</p>
        <p className="mt-1 text-xs text-muted-foreground">{nota}</p>
      </CardContent>
    </Card>
  );
}
