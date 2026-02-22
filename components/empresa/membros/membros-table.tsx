'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react';
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
import { updateMemberAction } from '@/actions/empresa/update-member.action';
import { removeMemberAction } from '@/actions/empresa/remove-member.action';
import { RolesModal } from './roles-modal';

interface WorkspaceRole {
  workspaceId: string;
  workspaceName: string;
  role: string;
  membershipId: string;
}

interface Member {
  membershipId: string;
  role: string;
  memberSince: string;
  workspaceRoles: WorkspaceRole[];
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    mustResetPassword: boolean;
  };
}

interface MembrosTableProps {
  data: Member[];
  total: number;
  page: number;
  limit: number;
  companyId: string;
  currentUserId: string;
}

export function MembrosTable({
  data,
  total,
  page,
  limit,
  companyId,
  currentUserId,
}: MembrosTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

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

  function handleToggleActive(userId: string, currentActive: boolean) {
    setActionError(null);
    startTransition(async () => {
      const result = await updateMemberAction(companyId, userId, !currentActive);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  }

  function handleRemove(userId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await removeMemberAction(companyId, userId);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
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

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papéis adicionais</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Membro desde</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum membro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((member) => {
                const isSelf = member.user.id === currentUserId;
                const isCompanyAdmin = member.role === 'admin';
                const wsAdmins =
                  member.workspaceRoles?.filter((w) => w.role === 'workspace_admin') ?? [];

                return (
                  <TableRow key={member.membershipId}>
                    <TableCell className="font-medium">{member.user.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.user.email}
                    </TableCell>

                    {/* Coluna papéis adicionais */}
                    <TableCell>
                      {isCompanyAdmin ? (
                        <Badge className="text-xs">Admin da empresa</Badge>
                      ) : wsAdmins.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {wsAdmins.map((ws) => (
                            <Badge key={ws.workspaceId} variant="outline" className="text-xs">
                              Admin: {ws.workspaceName}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={member.user.isActive ? 'outline' : 'secondary'}
                        className="text-xs"
                      >
                        {member.user.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(member.memberSince).toLocaleDateString('pt-BR')}
                    </TableCell>

                    <TableCell className="text-right">
                      {!isSelf && !isCompanyAdmin && (
                        <div className="flex items-center justify-end gap-1">
                          {/* Gerenciar papéis */}
                          <RolesModal
                            companyId={companyId}
                            userId={member.user.id}
                            userName={member.user.name}
                            onChanged={() => router.refresh()}
                          />

                          {/* Ativar / Inativar usuário */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={pending}
                                title={
                                  member.user.isActive ? 'Inativar usuário' : 'Reativar usuário'
                                }
                              >
                                {member.user.isActive ? (
                                  <UserX className="h-4 w-4 text-destructive" />
                                ) : (
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {member.user.isActive
                                    ? 'Inativar usuário?'
                                    : 'Reativar usuário?'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {member.user.isActive
                                    ? `${member.user.name} perderá o acesso à plataforma.`
                                    : `${member.user.name} voltará a ter acesso à plataforma.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleToggleActive(member.user.id, member.user.isActive)
                                  }
                                >
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {/* Remover da empresa */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={pending}
                                title="Remover da empresa"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover da empresa?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>{member.user.name}</strong> será removido desta empresa e
                                  de todos os seus workspaces. A conta do usuário não será excluída.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemove(member.user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} membro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
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
