'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
  SUBSCRIPTION_STATUS,
  type BadgeVariant,
} from '@/components/superadmin/financeiro/format';

interface Company {
  id: string;
  legalName: string;
  taxId: string;
  isActive: boolean;
  createdAt: string;
  subscription: {
    status: string;
    superadminLocked: boolean;
    accessSuspended: boolean;
  } | null;
}

// Suspensão e bloqueio manual definem o acesso de fato, então sobrepõem o status.
function billingBadge(sub: NonNullable<Company['subscription']>): {
  label: string;
  variant: BadgeVariant;
} {
  if (sub.accessSuspended) return { label: 'Suspenso', variant: 'destructive' };
  if (sub.superadminLocked) return { label: 'Bloqueado', variant: 'destructive' };
  return SUBSCRIPTION_STATUS[sub.status] ?? { label: sub.status, variant: 'outline' };
}

interface CompaniesTableProps {
  data: Company[];
  total: number;
  page: number;
  limit: number;
}

export function CompaniesTable({ data, total, page, limit }: CompaniesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
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
            placeholder="Buscar por nome ou CNPJ..."
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
          defaultValue={searchParams.get('isActive') ?? 'all'}
          onValueChange={(val) =>
            updateParams({ isActive: val === 'all' ? undefined : val, page: '1' })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Ativo</SelectItem>
            <SelectItem value="false">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razão Social</TableHead>
              <TableHead className="hidden md:table-cell">CNPJ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Financeiro</TableHead>
              <TableHead className="hidden md:table-cell">Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                  Nenhuma empresa encontrada.
                </TableCell>
              </TableRow>
            ) : (
              data.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/superadmin/empresas/${company.id}`}
                      className="hover:underline underline-offset-4"
                    >
                      {company.legalName}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm">{company.taxId}</TableCell>
                  <TableCell>
                    <Badge variant={company.isActive ? 'default' : 'secondary'}>
                      {company.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {company.subscription ? (
                      <Link
                        href={`/superadmin/financeiro/${company.id}`}
                        title="Ver financeiro"
                        className="inline-flex hover:opacity-80"
                      >
                        <Badge variant={billingBadge(company.subscription).variant}>
                          {billingBadge(company.subscription).label}
                        </Badge>
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {total} empresa{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
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
