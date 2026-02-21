'use client';

import { useEffect, useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, UserX, UserCheck } from 'lucide-react';
import { editUserAction, EditUserActionState } from '@/actions/superadmin/edit-user.action';
import { updateUserAction } from '@/actions/superadmin/update-user.action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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

interface UserDetailFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    isSelf: boolean;
  };
}

const initialState: EditUserActionState = {};

export function UserDetailForm({ user }: UserDetailFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(editUserAction, initialState);
  const [togglePending, startToggle] = useTransition();

  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      router.refresh();
      const t = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state.success, router]);

  function handleToggleActive() {
    startToggle(async () => {
      await updateUserAction(user.id, !user.isActive);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {/* Formulário de edição */}
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="id" value={user.id} />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              name="name"
              defaultValue={user.name}
              placeholder="Nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={user.phone ?? ''}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Deixe em branco para manter"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ao definir uma nova senha, o usuário será obrigado a redefini-la no próximo acesso.
            </p>
          </div>
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        {showSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Dados atualizados com sucesso.
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>

      {/* Zona de perigo — apenas para outros usuários */}
      {!user.isSelf && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-destructive">Zona de perigo</h3>
            <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
              <div>
                <p className="text-sm font-medium">
                  {user.isActive ? 'Inativar usuário' : 'Reativar usuário'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.isActive
                    ? 'O usuário perderá o acesso à plataforma imediatamente.'
                    : 'O usuário voltará a ter acesso à plataforma.'}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={user.isActive ? 'destructive' : 'outline'}
                    size="sm"
                    disabled={togglePending}
                  >
                    {user.isActive ? (
                      <>
                        <UserX className="h-4 w-4 mr-1" />
                        Inativar
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Reativar
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {user.isActive ? 'Inativar usuário?' : 'Reativar usuário?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {user.isActive
                        ? 'O usuário perderá acesso à plataforma.'
                        : 'O usuário voltará a ter acesso à plataforma.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleToggleActive}>Confirmar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
