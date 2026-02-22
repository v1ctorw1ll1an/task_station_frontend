'use client';

import { useEffect, useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import {
  createWorkspaceAction,
  CreateWorkspaceActionState,
} from '@/actions/empresa/create-workspace.action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CreateWorkspaceFormProps {
  companyId: string;
}

const initialState: CreateWorkspaceActionState = {};

export function CreateWorkspaceForm({ companyId }: CreateWorkspaceFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createWorkspaceAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Novo workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar workspace</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="companyId" value={companyId} />

          <div className="space-y-2">
            <Label htmlFor="name">Nome do workspace</Label>
            <Input id="name" name="name" placeholder="Ex: Desenvolvimento" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input id="description" name="description" placeholder="Descrição do workspace" />
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Administrador do workspace
            </p>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email</Label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                placeholder="admin@empresa.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Se o email não estiver cadastrado, o usuário receberá um convite por email.
              </p>
            </div>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Criando...' : 'Criar workspace'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
