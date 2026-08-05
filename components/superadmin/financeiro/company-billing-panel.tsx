'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import {
  adjustSeatsAction,
  cancelSubscriptionAction,
  extendTrialAction,
  setCourtesyAction,
  setReadonlyAction,
  suspendAccessAction,
} from '@/actions/superadmin/financeiro.action';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CHARGE_STATUS,
  CHARGE_TYPE,
  formatCents,
  formatDate,
  formatDateTime,
  METHOD_LABELS,
  PAYMENT_KIND,
  SUBSCRIPTION_STATUS,
} from '@/components/superadmin/financeiro/format';

interface Charge {
  id: string;
  type: string;
  paymentKind: string;
  status: string;
  amountCents: number;
  installments: number;
  seats: number;
  invoiceUrl: string | null;
  paidAt: string | null;
  failReason: string | null;
  createdAt: string;
}

interface Detail {
  subscription: {
    id: string;
    companyId: string;
    status: string;
    method: string | null;
    purchasedSeats: number;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    graceUntil: string | null;
    cancelAtPeriodEnd: boolean;
    superadminLocked: boolean;
    accessSuspended: boolean;
  };
  occupiedSeats: number;
  availableSeats: number;
  prices: { monthlyCents: number; annualCents: number };
  charges: Charge[];
}

export function CompanyBillingPanel({ companyId, detail }: { companyId: string; detail: Detail }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<null | 'seats' | 'trial' | 'cancel' | 'suspend'>(
    null,
  );
  const [seats, setSeats] = useState(String(detail.subscription.purchasedSeats));
  const [trialDate, setTrialDate] = useState('');

  const sub = detail.subscription;
  const st = SUBSCRIPTION_STATUS[sub.status] ?? { label: sub.status, variant: 'outline' as const };
  // Trial e cortesia têm assento sem compra nenhuma — dizer "comprados" aqui faz o
  // suporte ler a tela errado. Mesma regra da tela do cliente (cobranca-panel.tsx).
  const assentosIncluidos =
    sub.status === 'trial' || sub.status === 'courtesy' || sub.method === null;

  function run(fn: () => Promise<{ error?: string; success?: boolean }>) {
    setError(null);
    start(async () => {
      const r = await fn();
      if (r.error) setError(r.error);
      else {
        setOpenDialog(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Assinatura</CardTitle>
          <Badge variant={st.variant}>{st.label}</Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Field label="Método" value={sub.method ? METHOD_LABELS[sub.method] ?? sub.method : '—'} />
          <Field
            label="Usuários"
            value={`${detail.occupiedSeats} ocupados / ${sub.purchasedSeats} ${
              assentosIncluidos ? 'incluídos' : 'contratados'
            }`}
          />
          <Field label="Mensal" value={formatCents(detail.prices.monthlyCents)} />
          <Field label="Anual" value={formatCents(detail.prices.annualCents)} />
          <Field label="Fim do trial" value={formatDate(sub.trialEndsAt)} />
          <Field label="Renovação" value={formatDate(sub.currentPeriodEnd)} />
          <Field
            label="Observações"
            value={
              [
                sub.cancelAtPeriodEnd ? 'Cancela no fim do ciclo' : null,
                sub.accessSuspended ? 'ACESSO SUSPENSO' : null,
                sub.superadminLocked ? 'Somente leitura (manual)' : null,
                sub.graceUntil ? `Carência até ${formatDate(sub.graceUntil)}` : null,
              ]
                .filter(Boolean)
                .join(' · ') || '—'
            }
          />
        </CardContent>
      </Card>

      {/* ── Ações de gestão ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gerenciar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {/* Ajustar assentos */}
          <Dialog open={openDialog === 'seats'} onOpenChange={(o) => setOpenDialog(o ? 'seats' : null)}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={pending}>
                Ajustar usuários
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajustar usuários contratados</DialogTitle>
                <DialogDescription>
                  Altera o total sem gerar cobrança. Não pode ser menor que os usuários em uso (
                  {detail.occupiedSeats}).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="seats">Total de usuários</Label>
                <Input
                  id="seats"
                  type="number"
                  min={detail.occupiedSeats}
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  disabled={pending}
                  onClick={() => run(() => adjustSeatsAction(companyId, Number(seats)))}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cortesia */}
          {sub.status === 'courtesy' ? (
            <ConfirmButton
              label="Revogar cortesia"
              variant="outline"
              title="Revogar cortesia?"
              description="A empresa passará para somente leitura até assinar um plano."
              disabled={pending}
              onConfirm={() => run(() => setCourtesyAction(companyId, false))}
            />
          ) : (
            <ConfirmButton
              label="Conceder cortesia"
              variant="outline"
              title="Conceder cortesia?"
              description="A empresa fica isenta de cobrança e com acesso total. Cancela a assinatura recorrente no Asaas, se houver."
              disabled={pending}
              onConfirm={() => run(() => setCourtesyAction(companyId, true))}
            />
          )}

          {/* Estender trial */}
          <Dialog open={openDialog === 'trial'} onOpenChange={(o) => setOpenDialog(o ? 'trial' : null)}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={pending}>
                Estender trial
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Estender / conceder trial</DialogTitle>
                <DialogDescription>
                  Define uma nova data de fim do trial e coloca a empresa em período de teste.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="trialDate">Fim do trial</Label>
                <Input
                  id="trialDate"
                  type="date"
                  value={trialDate}
                  onChange={(e) => setTrialDate(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  disabled={pending || !trialDate}
                  onClick={() =>
                    run(() =>
                      extendTrialAction(companyId, new Date(`${trialDate}T23:59:59-03:00`).toISOString()),
                    )
                  }
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Somente-leitura: a empresa segue usando o app, sem criar/alterar */}
          {sub.superadminLocked ? (
            <ConfirmButton
              label="Liberar somente-leitura"
              variant="outline"
              title="Liberar somente-leitura?"
              description="A empresa volta a criar e editar normalmente. O acesso passa a depender só da cobrança."
              disabled={pending}
              onConfirm={() => run(() => setReadonlyAction(companyId, false))}
            />
          ) : (
            <ConfirmButton
              label="Forçar somente-leitura"
              variant="outline"
              title="Forçar somente-leitura?"
              description="A empresa CONTINUA usando o app: consulta tudo e pode apagar, mas não cria nem edita. Não tira o acesso."
              disabled={pending}
              onConfirm={() => run(() => setReadonlyAction(companyId, true))}
            />
          )}

          {/* Suspensão total: porta fechada — só para fraude/abuso/ordem judicial */}
          {sub.accessSuspended ? (
            <ConfirmButton
              label="Devolver acesso"
              variant="outline"
              title="Devolver o acesso da empresa?"
              description="A empresa volta a entrar no sistema. O que valer de cobrança continua valendo."
              disabled={pending}
              onConfirm={() => run(() => suspendAccessAction(companyId, false))}
            />
          ) : (
            <SuspendDialog
              open={openDialog === 'suspend'}
              onOpenChange={(o) => setOpenDialog(o ? 'suspend' : null)}
              pending={pending}
              onConfirm={(motivo) => run(() => suspendAccessAction(companyId, true, motivo))}
            />
          )}

          {/* Cancelar */}
          <Dialog open={openDialog === 'cancel'} onOpenChange={(o) => setOpenDialog(o ? 'cancel' : null)}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={pending}>
                Cancelar assinatura
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancelar assinatura</DialogTitle>
                <DialogDescription>
                  No fim do ciclo, a empresa mantém acesso até a data de renovação. Imediatamente, cai
                  em somente leitura agora.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => run(() => cancelSubscriptionAction(companyId, true))}
                >
                  No fim do ciclo
                </Button>
                <Button
                  variant="destructive"
                  disabled={pending}
                  onClick={() => run(() => cancelSubscriptionAction(companyId, false))}
                >
                  Imediatamente
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* ── Histórico de cobranças ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Parcelas</TableHead>
                  <TableHead className="text-right">Fatura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.charges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                      Nenhuma cobrança registrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  detail.charges.map((c) => {
                    const cs = CHARGE_STATUS[c.status] ?? { label: c.status, variant: 'outline' as const };
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(c.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">{CHARGE_TYPE[c.type] ?? c.type}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {PAYMENT_KIND[c.paymentKind] ?? c.paymentKind}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cs.variant}>{cs.label}</Badge>
                          {c.failReason && (
                            <span className="block text-xs text-destructive">{c.failReason}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatCents(c.amountCents)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center text-sm">
                          {c.installments > 1 ? `${c.installments}×` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {c.invoiceUrl ? (
                            <a
                              href={c.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              Abrir <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

/**
 * Suspender é a ação mais dura do painel: a empresa deixa de entrar no sistema.
 * Por isso pede motivo por escrito e explica a diferença para o somente-leitura.
 */
function SuspendDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pending: boolean;
  onConfirm: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState('');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={pending}>
          Suspender acesso total
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspender o acesso total?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            A empresa <strong>deixa de entrar no sistema</strong> — nem leitura. Use só para fraude,
            abuso ou ordem judicial. Para apenas impedir que criem e editem, use{' '}
            <strong>Forçar somente-leitura</strong>.
          </p>
          <div className="space-y-1">
            <Label htmlFor="motivo-suspensao">Motivo (fica registrado)</Label>
            <Input
              id="motivo-suspensao"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: fraude confirmada no chargeback #123"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending || motivo.trim().length < 3}
            onClick={() => onConfirm(motivo.trim())}
          >
            Suspender
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmButton({
  label,
  title,
  description,
  variant,
  disabled,
  onConfirm,
}: {
  label: string;
  title: string;
  description: string;
  variant: 'outline' | 'destructive';
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size="sm" disabled={disabled}>
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
