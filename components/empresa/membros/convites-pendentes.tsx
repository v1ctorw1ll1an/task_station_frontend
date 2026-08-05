'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Copy, MailPlus, X } from 'lucide-react';
import {
  ConvitePendente,
  reenviarConviteAction,
  revogarConviteAction,
} from '@/actions/empresa/convites.action';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/**
 * Quem foi convidado ainda NÃO é membro — não aparece em `MembrosTable`. Sem esta
 * lista o admin não teria como saber que o convite existe, reenviar ou cancelar.
 */
export function ConvitesPendentes({
  companyId,
  convites,
}: {
  companyId: string;
  convites: ConvitePendente[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [linkManual, setLinkManual] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (convites.length === 0) return null;

  async function reenviar(convite: ConvitePendente) {
    setPendingId(convite.id);
    setErro(null);
    setLinkManual(null);
    const res = await reenviarConviteAction(companyId, convite.email);
    setPendingId(null);
    if (res.error) {
      setErro(res.error);
      return;
    }
    // E-mail falhou: o link é a única saída do admin, então fica visível para copiar.
    if (res.emailSent === false && res.inviteLink) setLinkManual(res.inviteLink);
    startTransition(() => router.refresh());
  }

  async function revogar(convite: ConvitePendente) {
    setPendingId(convite.id);
    setErro(null);
    setLinkManual(null);
    const res = await revogarConviteAction(companyId, convite.id);
    setPendingId(null);
    if (res.error) {
      setErro(res.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Convites pendentes</h2>
        <p className="text-sm text-muted-foreground">
          Já têm conta no TaskDY e entram na empresa assim que aceitarem.
        </p>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      {linkManual && (
        <div className="rounded-md border border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700 p-3 space-y-2">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            O e-mail falhou. Compartilhe o link abaixo:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-background px-2 py-1 text-xs">
              {linkManual}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(linkManual)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail</TableHead>
              <TableHead>Convidado por</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {convites.map((convite) => (
              <TableRow key={convite.id}>
                <TableCell className="font-medium">{convite.email}</TableCell>
                <TableCell className="text-muted-foreground">{convite.invitedBy.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(convite.expiresAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pendingId === convite.id}
                    onClick={() => reenviar(convite)}
                  >
                    <MailPlus className="h-4 w-4 mr-1" />
                    Reenviar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pendingId === convite.id}
                    onClick={() => revogar(convite)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
