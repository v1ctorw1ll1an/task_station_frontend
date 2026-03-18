'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Users,
  Loader2,
} from 'lucide-react';
import { ICON_MAP, DEFAULT_ICON, DEFAULT_COLOR } from '@/lib/icons/project-icons';
import { cn } from '@/lib/utils';
import {
  getWorkspaceProjectsForSidebar,
  SidebarProject,
} from '@/actions/workspace/get-projetos-sidebar.action';
import {
  createProjetoAction,
  CreateProjetoActionState,
} from '@/actions/workspace/create-projeto.action';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EditProjetoDialog } from '@/components/workspace/kanban/edit-projeto-dialog';

export interface SidebarWorkspace {
  workspaceId: string;
  workspaceName: string;
  role: string;
}

interface WorkspaceNavItemProps {
  workspace: SidebarWorkspace;
  isExpanded: boolean;
  onToggle: (workspaceId: string) => void;
  isAdmin: boolean;
}

const initialProjetoState: CreateProjetoActionState = {};

function CreateProjetoSidebarDialog({
  workspaceId,
  onCreated,
}: {
  workspaceId: string;
  onCreated: (project: SidebarProject) => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createProjetoAction, initialProjetoState);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.projectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      onCreated({ id: state.projectId, name: '', isActive: true, description: null, icon: null, iconColor: null });
      router.push(
        `/workspace/${workspaceId}/projetos/${state.projectId}`,
      );
    }
  }, [state.success, state.projectId, workspaceId, router, onCreated]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="Novo projeto"
          className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
          suppressHydrationWarning
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <Input name="name" placeholder="Nome do projeto" required autoFocus />
          <Input name="description" placeholder="Descrição (opcional)" />
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

export function WorkspaceNavItem({
  workspace,
  isExpanded,
  onToggle,
  isAdmin,
}: WorkspaceNavItemProps) {
  const pathname = usePathname();
  const [projects, setProjects] = useState<SidebarProject[]>([]);
  const [loading, setLoading] = useState(false);

  const isWorkspaceActive =
    pathname.startsWith(`/workspace/${workspace.workspaceId}/`) ||
    pathname === `/workspace/${workspace.workspaceId}/projetos`;

  useEffect(() => {
    if (!isExpanded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getWorkspaceProjectsForSidebar(workspace.workspaceId)
      .then((data) => setProjects(data))
      .finally(() => setLoading(false));
  }, [isExpanded, workspace.workspaceId]);

  useEffect(() => {
    function handleProjetoUpdated(e: Event) {
      const { projectId, name, description, icon, iconColor } = (e as CustomEvent<{
        projectId: string;
        name: string;
        description: string;
        icon: string;
        iconColor: string;
      }>).detail;
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, name, description, icon, iconColor } : p,
        ),
      );
    }
    window.addEventListener('projeto:updated', handleProjetoUpdated);
    return () => window.removeEventListener('projeto:updated', handleProjetoUpdated);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleProjectCreated = useCallback((_project: SidebarProject) => {
    // Refresh project list after creation
    getWorkspaceProjectsForSidebar(workspace.workspaceId).then(setProjects);
  }, [workspace.workspaceId]);

  const visibleProjects = isAdmin ? projects : projects.filter((p) => p.isActive);

  return (
    <div>
      {/* Workspace row */}
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors cursor-pointer',
          isWorkspaceActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )}
      >
        {/* Toggle arrow */}
        <button
          onClick={() => onToggle(workspace.workspaceId)}
          className="shrink-0 p-0.5 rounded hover:bg-accent"
          aria-label={isExpanded ? 'Recolher' : 'Expandir'}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Workspace name link */}
        <Link
          href={`/workspace/${workspace.workspaceId}/projetos`}
          className="flex-1 text-sm font-medium truncate min-w-0"
          onClick={() => {
            if (!isExpanded) onToggle(workspace.workspaceId);
          }}
        >
          {workspace.workspaceName}
        </Link>

        {/* Actions (visible on hover) */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
          {isAdmin && (
            <CreateProjetoSidebarDialog
              workspaceId={workspace.workspaceId}
              onCreated={handleProjectCreated}
            />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border/50 pl-2">
          {loading ? (
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Carregando...
            </div>
          ) : visibleProjects.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground italic">
              Nenhum projeto ainda
            </p>
          ) : (
            visibleProjects.map((project) => {
              const href = `/workspace/${workspace.workspaceId}/projetos/${project.id}`;
              const isActive = pathname.includes(`/projetos/${project.id}`);
              const IconComponent = ICON_MAP[project.icon ?? DEFAULT_ICON] ?? ICON_MAP[DEFAULT_ICON];
              return (
                <div
                  key={project.id}
                  className={cn(
                    'group flex items-center gap-1 rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    !project.isActive && 'opacity-50',
                  )}
                >
                  <Link
                    href={href}
                    className="flex flex-1 items-center gap-2 px-2 py-1.5 text-sm min-w-0"
                  >
                    <IconComponent
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: project.iconColor ?? DEFAULT_COLOR }}
                    />
                    <span className="truncate">{project.name}</span>
                  </Link>
                  {isAdmin && (
                    <span
                      className="pr-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EditProjetoDialog
                        projectId={project.id}
                        workspaceId={workspace.workspaceId}
                        currentName={project.name}
                        currentDescription={project.description}
                        currentIcon={project.icon}
                        currentIconColor={project.iconColor}
                        variant="sidebar"
                        triggerClassName={
                          isActive
                            ? 'p-1 rounded hover:bg-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                            : 'p-1 rounded hover:bg-accent text-foreground/50 hover:text-foreground transition-colors'
                        }
                      />
                    </span>
                  )}
                </div>
              );
            })
          )}

          {/* Workspace admin link */}
          {isAdmin && (
            <Link
              href={`/workspace/${workspace.workspaceId}/membros`}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                pathname.startsWith(`/workspace/${workspace.workspaceId}/membros`)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Users className="h-3 w-3 shrink-0" />
              Membros
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
