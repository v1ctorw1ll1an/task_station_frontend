'use client';

import { useCallback, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ChevronLeft, ChevronRight, RotateCw, Search } from 'lucide-react';
import { reprocessWebhookAction } from '@/actions/superadmin/financeiro.action';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime, WEBHOOK_STATUS } from '@/components/superadmin/financeiro/format';

interface WebhookRow {
  id: string;
  asaasEventId: string;
  type: string;
  asaasPaymentId: string | null;
  status: string;
  processedAt: string | null;
  error: string | null;
  createdAt: string;
}

interface Props {
  data: WebhookRow[];
  total: number;
  page: number;
  limit: number;
}

/** Estados em que reprocessar faz sentido (evento gravado que não fechou). */
const REPROCESSABLE = new Set(['failed', 'dead', 'received']);

export function WebhooksTable({ data, total, page, limit }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const reprocess = useCallback(
    (id: string) => {
      setError(null);
      start(async () => {
        const r = await reprocessWebhookAction(id);
        if (r.error) setError(r.error);
        else router.refresh();
      });
    },
    [router],
  );

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '') params.delete(key);
        else params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por tipo (ex: PAYMENT_RECEIVED)..."
            defaultValue={searchParams.get('type') ?? ''}
            className="pl-9"
            onChange={(e) => {
              const val = e.target.value;
              const timeout = setTimeout(() => updateParams({ type: val, page: '1' }), 400);
              return () => clearTimeout(timeout);
            }}
          />
        </div>
        <Select
          defaultValue={searchParams.get('status') ?? 'all'}
          onValueChange={(val) => updateParams({ status: val === 'all' ? undefined : val, page: '1' })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(WEBHOOK_STATUS).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recebido em</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Pagamento</TableHead>
              <TableHead className="hidden lg:table-cell">Erro</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                  Nenhum evento de webhook registrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const st = WEBHOOK_STATUS[row.status] ?? { label: row.status, variant: 'outline' as const };
                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.type}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                      {row.asaasPaymentId ?? '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-destructive max-w-xs truncate">
                      {row.error ?? ''}
                    </TableCell>
                    <TableCell className="text-right">
                      {REPROCESSABLE.has(row.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() => reprocess(row.id)}
                          title="Reprocessar este evento (idempotente)"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                          Reprocessar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {total} evento{total !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
