'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Building2, ShieldOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { revokeCompanyAdminAction } from '@/actions/superadmin/revoke-company-admin.action';

interface Company {
  id: string;
  legalName: string;
  taxId: string;
  isActive: boolean;
}

interface Membership {
  id: string;
  role: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
  company: Company | null;
}

interface UserCompanyMembershipsProps {
  userId: string;
  memberships: Membership[];
}

export function UserCompanyMemberships({ userId, memberships }: UserCompanyMembershipsProps) {
  const [confirmRevoke, setConfirmRevoke] = useState<{
    membershipId: string;
    companyId: string;
    companyName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    if (!confirmRevoke) return;
    setError(null);
    startTransition(async () => {
      const result = await revokeCompanyAdminAction(
        confirmRevoke.companyId,
        confirmRevoke.membershipId,
        userId,
      );
      setConfirmRevoke(null);
      if (result.error) setError(result.error);
    });
  }

  if (memberships.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Building2 className="h-4 w-4" />
        Este usuário não está vinculado a nenhuma empresa.
      </div>
    );
  }

  return (
    <>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-md border divide-y">
        {memberships.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <Link
                href={`/superadmin/empresas/${m.company!.id}`}
                className="text-sm font-medium hover:underline"
              >
                {m.company!.legalName}
              </Link>
              <p className="text-xs text-muted-foreground">
                CNPJ: {m.company!.taxId} · Vínculo desde{' '}
                {new Date(m.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {m.role === 'admin' ? 'Administrador' : m.role}
              </Badge>
              <Badge
                variant={m.company!.isActive ? 'default' : 'secondary'}
                className="text-xs"
              >
                {m.company!.isActive ? 'Empresa ativa' : 'Empresa inativa'}
              </Badge>
              {m.role === 'admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  title="Revogar administrador desta empresa"
                  onClick={() =>
                    setConfirmRevoke({
                      membershipId: m.id,
                      companyId: m.company!.id,
                      companyName: m.company!.legalName,
                    })
                  }
                >
                  <ShieldOff className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!confirmRevoke} onOpenChange={(open) => !open && setConfirmRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário perderá o papel de administrador em{' '}
              <strong>{confirmRevoke?.companyName}</strong>. Ele continuará sendo membro da empresa,
              mas sem privilégios de administração. Esta ação pode ser revertida promovendo-o
              novamente pelo painel da empresa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRevoke}
            >
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
