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
import { ProjectIconPicker } from '@/components/workspace/projetos/project-icon-picker';
import { DEFAULT_ICON, DEFAULT_COLOR } from '@/lib/icons/project-icons';

interface EditProjetoDialogProps {
  projectId: string;
  workspaceId: string;
  currentName: string;
  currentDescription: string | null;
  currentIcon?: string | null;
  currentIconColor?: string | null;
  variant?: 'default' | 'sidebar';
  triggerClassName?: string;
}

export function EditProjetoDialog({
  projectId,
  workspaceId,
  currentName,
  currentDescription,
  currentIcon,
  currentIconColor,
  variant = 'default',
  triggerClassName,
}: EditProjetoDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription ?? '');
  const [icon, setIcon] = useState(currentIcon ?? DEFAULT_ICON);
  const [iconColor, setIconColor] = useState(currentIconColor ?? DEFAULT_COLOR);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleSave() {
    const fd = new FormData();
    fd.set('workspaceId', workspaceId);
    fd.set('projectId', projectId);
    fd.set('name', name);
    fd.set('description', description);
    fd.set('icon', icon);
    fd.set('iconColor', iconColor);

    startTransition(async () => {
      const result = await updateProjetoAction({}, fd);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setError('');
        window.dispatchEvent(
          new CustomEvent('projeto:updated', {
            detail: { projectId, name, description, icon, iconColor },
          }),
        );
        router.refresh();
      }
    });
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v) {
      setName(currentName);
      setDescription(currentDescription ?? '');
      setIcon(currentIcon ?? DEFAULT_ICON);
      setIconColor(currentIconColor ?? DEFAULT_COLOR);
      setError('');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

      <DialogContent className="sm:max-w-md">
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

          <div className="space-y-2">
            <Label>Ícone e cor</Label>
            <ProjectIconPicker
              icon={icon}
              color={iconColor}
              onChange={(i, c) => { setIcon(i); setIconColor(c); }}
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
