'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, Users, ExternalLink } from 'lucide-react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  updateWorkspaceAction,
  UpdateWorkspaceActionState,
} from '@/actions/empresa/update-workspace.action';
import type { SidebarWorkspace } from './workspace-nav-item';

interface WorkspaceSettingsDialogProps {
  workspace: SidebarWorkspace;
}

const initialState: UpdateWorkspaceActionState = {};

export function WorkspaceSettingsDialog({ workspace }: WorkspaceSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateWorkspaceAction, initialState);
  const [, startClose] = useTransition();

  useEffect(() => {
    if (state.success) {
      startClose(() => {
        setOpen(false);
        router.refresh();
      });
    }
  }, [state.success, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="Configurações do workspace"
          className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
          suppressHydrationWarning
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="companyId" value={workspace.companyId} />
          <input type="hidden" name="workspaceId" value={workspace.workspaceId} />

          <div className="space-y-2">
            <Label htmlFor="ws-name">Nome</Label>
            <Input
              id="ws-name"
              name="name"
              defaultValue={workspace.workspaceName}
              placeholder="Nome do workspace"
              autoFocus
            />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>

        <Separator />

        <div className="space-y-1">
          <Link
            href={`/workspace/${workspace.workspaceId}/membros`}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gerenciar membros
            </span>
            <ExternalLink className="h-3.5 w-3.5 opacity-50" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
