'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PowerOff, Trash2 } from 'lucide-react';
import { deactivateCompanyAction } from '@/actions/superadmin/deactivate-company.action';
import { deleteCompanyAction } from '@/actions/superadmin/delete-company.action';
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

interface CompanyActionsProps {
  id: string;
  isActive: boolean;
}

export function CompanyActions({ id, isActive }: CompanyActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDeactivate() {
    startTransition(async () => {
      await deactivateCompanyAction(id);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteCompanyAction(id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      {isActive && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isPending}>
              <PowerOff className="h-4 w-4 text-orange-500" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Inativar empresa?</AlertDialogTitle>
              <AlertDialogDescription>
                A empresa será marcada como inativa. Esta ação pode ser revertida editando a empresa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeactivate}>Inativar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isPending}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              A empresa será removida permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
