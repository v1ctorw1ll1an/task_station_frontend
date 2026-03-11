'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, Users, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkspaceNavItem, SidebarWorkspace } from './workspace-nav-item';
import { CreateWorkspaceInlineTrigger } from './create-workspace-inline';

interface AppSidebarProps {
  companyId: string;
  companyName: string;
  isCompanyAdmin: boolean;
  isSuperuser: boolean;
  workspaces: SidebarWorkspace[];
}

export function AppSidebar({
  companyId,
  companyName,
  isCompanyAdmin,
  workspaces,
}: AppSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const currentWorkspaceId = params?.workspaceId as string | undefined;

  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(() => {
    const initial = currentWorkspaceId ?? workspaces[0]?.workspaceId;
    return new Set(initial ? [initial] : []);
  });

  // Auto-expand the current workspace when navigation changes
  useEffect(() => {
    if (currentWorkspaceId) {
      setExpandedWorkspaces((prev) => {
        if (prev.has(currentWorkspaceId)) return prev;
        return new Set([...prev, currentWorkspaceId]);
      });
    }
  }, [currentWorkspaceId]);

  const toggleWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(workspaceId)) {
        next.delete(workspaceId);
      } else {
        next.add(workspaceId);
      }
      return next;
    });
  };

  return (
    <aside className="w-60 min-h-screen bg-sidebar border-r flex flex-col">
      {/* Company header */}
      <div className="px-4 py-4 border-b">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
          Empresa
        </p>
        <p className="text-sm font-semibold truncate leading-tight" title={companyName}>
          {companyName}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {/* Top-level links */}
        <Link
          href={`/empresa/${companyId}/workspaces`}
          className={cn(
            'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
            pathname === `/empresa/${companyId}/workspaces`
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <Home className="h-4 w-4 shrink-0" />
          <span>Início</span>
        </Link>

        {isCompanyAdmin && (
          <Link
            href={`/empresa/${companyId}/membros`}
            className={cn(
              'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
              pathname.startsWith(`/empresa/${companyId}/membros`)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>Membros</span>
          </Link>
        )}

        {/* Workspaces section divider */}
        <div className="pt-3 pb-1 flex items-center justify-between px-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Workspaces
          </span>
          {isCompanyAdmin && (
            <CreateWorkspaceInlineTrigger companyId={companyId} />
          )}
        </div>

        {/* Workspace tree */}
        {workspaces.length === 0 ? (
          <div className="px-2 py-3 text-center">
            <p className="text-xs text-muted-foreground italic mb-2">
              Nenhum workspace ainda.
            </p>
            {isCompanyAdmin && (
              <CreateWorkspaceInlineTrigger companyId={companyId} variant="button" />
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {workspaces.map((ws) => (
              <WorkspaceNavItem
                key={ws.workspaceId}
                workspace={ws}
                isExpanded={expandedWorkspaces.has(ws.workspaceId)}
                onToggle={toggleWorkspace}
                isAdmin={isCompanyAdmin || ws.role === 'workspace_admin'}
              />
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
