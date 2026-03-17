'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProjetoAction } from '@/actions/workspace/update-projeto.action';

interface EditProjetoDialogProps {
  projectId: string;
  workspaceId: string;
  currentName: string;
  currentDescription: string | null;
  variant?: 'default' | 'sidebar';
  triggerClassName?: string;
}

export function EditProjetoDialog({
  projectId,
  workspaceId,
  currentName,
  currentDescription,
  variant = 'default',
  triggerClassName,
}: EditProjetoDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription ?? '');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleSave() {
    const fd = new FormData();
    fd.set('workspaceId', workspaceId);
    fd.set('projectId', projectId);
    fd.set('name', name);
    fd.set('description', description);

    startTransition(async () => {
      const result = await updateProjetoAction({}, fd);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setError('');
        window.dispatchEvent(
          new CustomEvent('projeto:updated', {
            detail: { projectId, name, description },
          }),
        );
        router.refresh();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setName(currentName);
          setDescription(currentDescription ?? '');
          setError('');
        }
      }}
    >
      <DialogTrigger asChild>
        {variant === 'sidebar' ? (
          <button className={triggerClassName ?? 'p-1 rounded hover:bg-accent text-foreground/50 hover:text-foreground transition-colors'}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar projeto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proj-name">Nome</Label>
            <Input
              id="proj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-desc">Descrição</Label>
            <textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descrição do projeto (opcional)"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={pending || !name.trim()}>
              {pending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
