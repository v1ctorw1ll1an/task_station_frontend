'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, UserX } from 'lucide-react';
import { updateUserAction } from '@/actions/superadmin/update-user.action';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserActionsProps {
  id: string;
  isActive: boolean;
  isSelf: boolean;
}

export function UserActions({ id, isActive, isSelf }: UserActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      await updateUserAction(id, !isActive);
      router.refresh();
    });
  }

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">você</span>;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isPending}>
          {isActive ? (
            <UserX className="h-4 w-4 text-orange-500" />
          ) : (
            <UserCheck className="h-4 w-4 text-green-600" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isActive ? 'Inativar usuário?' : 'Reativar usuário?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {isActive
              ? 'O usuário perderá acesso à plataforma.'
              : 'O usuário voltará a ter acesso à plataforma.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggle}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
