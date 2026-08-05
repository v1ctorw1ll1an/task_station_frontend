'use client';

import { MSG_SOMENTE_LEITURA, useReadOnly } from '@/components/billing/billing-mode';

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
import { ProjectIconPicker } from './project-icon-picker';
import { DEFAULT_ICON, DEFAULT_COLOR } from '@/lib/icons/project-icons';

interface CreateProjetoFormProps {
  workspaceId: string;
}

const initialState: CreateProjetoActionState = {};

export function CreateProjetoForm({ workspaceId }: CreateProjetoFormProps) {
  const readOnly = useReadOnly();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createProjetoAction, initialState);
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [iconColor, setIconColor] = useState<string | null>(DEFAULT_COLOR);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.projectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.push(`/workspace/${workspaceId}/projetos/${state.projectId}`);
    } else if (state.success) {

      setOpen(false);
      router.refresh();
    }
  }, [state.success, state.projectId, workspaceId, router]);

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v) {
      setIcon(DEFAULT_ICON);
      setIconColor(DEFAULT_COLOR);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          data-tour="novo-projeto"
          disabled={readOnly}
          title={readOnly ? MSG_SOMENTE_LEITURA : undefined}
        >
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
          <input type="hidden" name="icon" value={icon} />
          <input type="hidden" name="iconColor" value={iconColor ?? ''} />

          <div className="space-y-2">
            <Label htmlFor="name">Nome do projeto</Label>
            <Input id="name" name="name" placeholder="Ex: Site Institucional" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input id="description" name="description" placeholder="Descrição do projeto" />
          </div>

          <div className="space-y-2">
            <Label>Ícone e cor</Label>
            <ProjectIconPicker
              icon={icon}
              color={iconColor}
              onChange={(i, c) => { setIcon(i); setIconColor(c); }}
            />
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
