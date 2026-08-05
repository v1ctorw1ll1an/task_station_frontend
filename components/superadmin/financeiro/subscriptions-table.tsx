'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
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
import {
  formatCents,
  formatDate,
  METHOD_LABELS,
  SUBSCRIPTION_STATUS,
} from '@/components/superadmin/financeiro/format';

interface SubscriptionRow {
  companyId: string;
  company: { id: string; legalName: string; taxId: string; isActive: boolean };
  status: string;
  method: string | null;
  purchasedSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  monthlyCents: number;
}

interface Props {
  data: SubscriptionRow[];
  total: number;
  page: number;
  limit: number;
}

export function SubscriptionsTable({ data, total, page, limit }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa ou CNPJ..."
            defaultValue={searchParams.get('search') ?? ''}
            className="pl-9"
            onChange={(e) => {
              const val = e.target.value;
              const timeout = setTimeout(() => updateParams({ search: val, page: '1' }), 400);
              return () => clearTimeout(timeout);
            }}
          />
        </div>
        <Select
          defaultValue={searchParams.get('status') ?? 'all'}
          onValueChange={(val) => updateParams({ status: val === 'all' ? undefined : val, page: '1' })}
        >
          <SelectTrigger className="w-44">
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(SUBSCRIPTION_STATUS).map(([value, { label }]) => (
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
              <TableHead>Empresa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Método</TableHead>
              <TableHead className="text-center">Usuários</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Mensal</TableHead>
              <TableHead className="hidden lg:table-cell">Renovação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                  Nenhuma assinatura encontrada.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const st = SUBSCRIPTION_STATUS[row.status] ?? { label: row.status, variant: 'outline' as const };
                return (
                  <TableRow key={row.companyId}>
                    <TableCell className="font-medium">
                      {row.company.legalName}
                      <span className="block font-mono text-xs text-muted-foreground">
                        {row.company.taxId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {row.method ? METHOD_LABELS[row.method] ?? row.method : '—'}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <span className="font-medium">{row.occupiedSeats}</span>
                      <span className="text-muted-foreground"> / {row.purchasedSeats}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right text-sm">
                      {formatCents(row.monthlyCents)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatDate(row.currentPeriodEnd ?? row.trialEndsAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/superadmin/financeiro/${row.companyId}`}>Detalhes</Link>
                      </Button>
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
            {total} assinatura{total !== 1 ? 's' : ''}
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
