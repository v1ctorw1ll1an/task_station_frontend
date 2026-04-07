'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronDown,
  GripVertical,
  LayoutList,
  Plus,
  Users,
  Loader2,
} from 'lucide-react';
import { WorkspaceSettingsDialog } from './workspace-settings-dialog';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ICON_MAP, DEFAULT_ICON, DEFAULT_COLOR } from '@/lib/icons/project-icons';
import { cn } from '@/lib/utils';
import { useMobileNav } from './sidebar-shell';
import {
  createProjetoAction,
  CreateProjetoActionState,
} from '@/actions/workspace/create-projeto.action';
import { useActionState } from 'react';
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
import { EditProjetoDialog } from '@/components/workspace/kanban/edit-projeto-dialog';
import { ProjectIconPicker } from '@/components/workspace/projetos/project-icon-picker';
import { SidebarProject } from '@/actions/workspace/get-projetos-sidebar.action';

export interface SidebarWorkspace {
  workspaceId: string;
  workspaceName: string;
  companyId: string;
  role: string;
}

interface WorkspaceNavItemProps {
  workspace: SidebarWorkspace;
  isExpanded: boolean;
  onToggle: (workspaceId: string) => void;
  isAdmin: boolean;
  projects: SidebarProject[];
  loadingProjects: boolean;
  onProjectCreated: (workspaceId: string) => void;
}

const initialProjetoState: CreateProjetoActionState = {};

function CreateProjetoSidebarDialog({
  workspaceId,
  onCreated,
  footerMode = false,
}: {
  workspaceId: string;
  onCreated: (project: SidebarProject) => void;
  footerMode?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createProjetoAction, initialProjetoState);
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [iconColor, setIconColor] = useState<string | null>(DEFAULT_COLOR);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.projectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      onCreated({ id: state.projectId, name: '', isActive: true, description: null, icon, iconColor });
      router.push(`/workspace/${workspaceId}/projetos/${state.projectId}`);
    }
  }, [state.success, state.projectId, workspaceId, router, onCreated, icon, iconColor]);

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
        {footerMode ? (
          <button
            title="Novo projeto"
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Plus className="h-3 w-3 shrink-0" />
            Novo projeto
          </button>
        ) : (
          <button
            title="Novo projeto"
            className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
            suppressHydrationWarning
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="icon" value={icon} />
          <input type="hidden" name="iconColor" value={iconColor ?? ''} />

          <div className="space-y-2">
            <Label htmlFor="sidebar-proj-name">Nome do projeto</Label>
            <Input id="sidebar-proj-name" name="name" placeholder="Ex: Site Institucional" required autoFocus />
          </div>

          <Input name="description" placeholder="Descrição (opcional)" />

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

function SortableProject({
  project,
  workspaceId,
  isAdmin,
  isActive: isCurrentPage,
}: {
  project: SidebarProject;
  workspaceId: string;
  isAdmin: boolean;
  isActive: boolean;
}) {
  const mobileNav = useMobileNav();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: { type: 'project', workspaceId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const href = `/workspace/${workspaceId}/projetos/${project.id}`;
  const IconComponent = ICON_MAP[project.icon ?? DEFAULT_ICON] ?? ICON_MAP[DEFAULT_ICON];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-1 rounded-md transition-colors',
        isDragging ? 'opacity-50' : '',
        isCurrentPage
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        !project.isActive && 'opacity-50',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing shrink-0 p-0.5 pl-1"
        tabIndex={-1}
        aria-label="Arrastar projeto"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Link
        href={href}
        onClick={mobileNav?.close}
        className="flex flex-1 items-center gap-2 py-1.5 text-sm min-w-0"
      >
        <IconComponent
          className="h-3.5 w-3.5 shrink-0"
          style={project.iconColor && !isCurrentPage ? { color: project.iconColor } : undefined}
        />
        <span className="truncate">{project.name}</span>
      </Link>
      {isAdmin && (
        <span className="pr-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <EditProjetoDialog
            projectId={project.id}
            workspaceId={workspaceId}
            currentName={project.name}
            currentDescription={project.description}
            currentIcon={project.icon}
            currentIconColor={project.iconColor}
            variant="sidebar"
            triggerClassName={
              isCurrentPage
                ? 'p-1 rounded hover:bg-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground transition-colors'
                : 'p-1 rounded hover:bg-accent text-foreground/50 hover:text-foreground transition-colors'
            }
          />
        </span>
      )}
    </div>
  );
}

export function WorkspaceNavItem({
  workspace,
  isExpanded,
  onToggle,
  isAdmin,
  projects,
  loadingProjects,
  onProjectCreated,
}: WorkspaceNavItemProps) {
  const pathname = usePathname();
  const mobileNav = useMobileNav();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: workspace.workspaceId,
    data: { type: 'workspace' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isWorkspaceActive =
    pathname.startsWith(`/workspace/${workspace.workspaceId}/`) ||
    pathname === `/workspace/${workspace.workspaceId}/projetos`;

  const visibleProjects = isAdmin ? projects : projects.filter((p) => p.isActive);

  const handleCreated = useCallback(
    () => {
      onProjectCreated(workspace.workspaceId);
    },
    [workspace.workspaceId, onProjectCreated],
  );

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging ? 'opacity-50' : '')}>
      {/* Workspace row */}
      <div
        className={cn(
          'group flex items-center gap-1 px-1 py-1.5 rounded-md transition-colors cursor-pointer',
          isWorkspaceActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing shrink-0 p-0.5"
          tabIndex={-1}
          aria-label="Arrastar workspace"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

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
            mobileNav?.close();
          }}
        >
          {workspace.workspaceName}
        </Link>

        {/* Actions (visible on hover) */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
          {isAdmin && (
            <WorkspaceSettingsDialog workspace={workspace} />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border/50 pl-2">
          {loadingProjects ? (
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Carregando...
            </div>
          ) : visibleProjects.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground italic">
              Nenhum projeto ainda
            </p>
          ) : (
            <SortableContext
              items={visibleProjects.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {visibleProjects.map((project) => (
                <SortableProject
                  key={project.id}
                  project={project}
                  workspaceId={workspace.workspaceId}
                  isAdmin={isAdmin}
                  isActive={pathname.includes(`/projetos/${project.id}`)}
                />
              ))}
            </SortableContext>
          )}

          {/* Novo projeto */}
          {isAdmin && (
            <CreateProjetoSidebarDialog
              workspaceId={workspace.workspaceId}
              onCreated={handleCreated}
              footerMode
            />
          )}

          {/* Visão Geral */}
          <Link
            href={`/workspace/${workspace.workspaceId}/visao-geral`}
            onClick={mobileNav?.close}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
              pathname.startsWith(`/workspace/${workspace.workspaceId}/visao-geral`)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <LayoutList className="h-3 w-3 shrink-0" />
            Visão Geral
          </Link>

          {isAdmin && (
            <Link
              href={`/workspace/${workspace.workspaceId}/membros`}
              onClick={mobileNav?.close}
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
