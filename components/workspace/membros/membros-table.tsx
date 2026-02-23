'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldOff,
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
import { promoteAdminAction } from '@/actions/workspace/promote-admin.action';
import { revokeAdminAction } from '@/actions/workspace/revoke-admin.action';
import { removeMembroAction } from '@/actions/workspace/remove-membro.action';

interface Member {
  membershipId: string;
  role: string;
  memberSince: string;
  user: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
}

interface MembrosTableProps {
  data: Member[];
  total: number;
  page: number;
  limit: number;
  workspaceId: string;
  currentUserId: string;
}

export function WorkspaceMembrosTable({
  data,
  total,
  page,
  limit,
  workspaceId,
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

  function handlePromote(userId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await promoteAdminAction(workspaceId, userId);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  }

  function handleRevoke(userId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await revokeAdminAction(workspaceId, userId);
      if (result?.error) setActionError(result.error);
      else router.refresh();
    });
  }

  function handleRemove(userId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await removeMembroAction(workspaceId, userId);
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
              <TableHead>Papel</TableHead>
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
                const isAdmin = member.role === 'workspace_admin';

                return (
                  <TableRow key={member.membershipId}>
                    <TableCell className="font-medium">{member.user.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.user.email}
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Badge className="text-xs">Admin</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Membro</span>
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
                      {!isSelf && (
                        <div className="flex items-center justify-end gap-1">
                          {/* Promover / revogar admin */}
                          {isAdmin ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={pending}
                                  title="Revogar papel de admin"
                                >
                                  <ShieldOff className="h-4 w-4 text-orange-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Revogar papel de admin?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <strong>{member.user.name}</strong> perderá o papel de
                                    administrador, mas continuará como membro do workspace.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRevoke(member.user.id)}>
                                    Revogar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={pending}
                                  title="Promover a admin"
                                >
                                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Promover {member.user.name} a admin?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <strong>{member.user.name}</strong> terá acesso de
                                    administrador a este workspace, podendo gerenciar projetos e
                                    membros.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handlePromote(member.user.id)}
                                  >
                                    Promover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {/* Remover membro */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={pending || isAdmin}
                                title={
                                  isAdmin
                                    ? 'Revogue o papel de admin antes de remover'
                                    : 'Remover do workspace'
                                }
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover do workspace?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>{member.user.name}</strong> será removido deste
                                  workspace. A conta do usuário não será excluída.
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
