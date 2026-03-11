'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import {
  createProjetoAction,
  CreateProjetoActionState,
} from '@/actions/workspace/create-projeto.action';
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

interface CreateProjetoFormProps {
  workspaceId: string;
}

const initialState: CreateProjetoActionState = {};

export function CreateProjetoForm({ workspaceId }: CreateProjetoFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createProjetoAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.projectId) {
      setOpen(false);
      router.push(`/workspace/${workspaceId}/projetos/${state.projectId}`);
    } else if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, state.projectId, workspaceId, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Novo projeto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar projeto</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />

          <div className="space-y-2">
            <Label htmlFor="name">Nome do projeto</Label>
            <Input id="name" name="name" placeholder="Ex: Site Institucional" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input id="description" name="description" placeholder="Descrição do projeto" />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Criando...' : 'Criar projeto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
