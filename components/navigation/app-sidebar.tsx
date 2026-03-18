'use client';

import { useState, useEffect, startTransition } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, LayoutGrid, Megaphone, Users, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkspaceNavItem, SidebarWorkspace } from './workspace-nav-item';
import { CreateWorkspaceInlineTrigger } from './create-workspace-inline';
import { gravatarUrl } from '@/lib/gravatar';
import { getProfileAction } from '@/actions/perfil/get-profile.action';

interface AppSidebarProps {
  companyId: string;
  companyName: string;
  isCompanyAdmin: boolean;
  workspaces: SidebarWorkspace[];
  userEmail: string;
}

export function AppSidebar({
  companyId,
  companyName,
  isCompanyAdmin,
  workspaces,
  userEmail,
}: AppSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const currentWorkspaceId = params?.workspaceId as string | undefined;

  const [collapsed, setCollapsed] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(() => {
    const initial = currentWorkspaceId ?? workspaces[0]?.workspaceId;
    return new Set(initial ? [initial] : []);
  });

  useEffect(() => {
    getProfileAction().then(({ data }) => {
      if (data?.photoUrl) {
        const url = data.photoUrl.startsWith('http')
          ? data.photoUrl
          : `${process.env.NEXT_PUBLIC_API_URL}${data.photoUrl}`;
        setAvatarSrc(url);
      } else {
        gravatarUrl(userEmail, 40).then(setAvatarSrc);
      }
    });
  }, [userEmail]);

  // Auto-expand the current workspace when navigation changes
  useEffect(() => {
    if (currentWorkspaceId) {
      startTransition(() => {
        setExpandedWorkspaces((prev) => {
          if (prev.has(currentWorkspaceId)) return prev;
          return new Set([...prev, currentWorkspaceId]);
        });
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
    <aside
      className={cn(
        'h-screen sticky top-0 bg-sidebar border-r flex flex-col transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      {/* Company header */}
      <div className="px-3 py-4 border-b flex items-center justify-between min-h-[60px]">
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
              Empresa
            </p>
            <p className="text-sm font-semibold truncate leading-tight" title={companyName}>
              {companyName}
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md
                     text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {/* Top-level links */}
        <Link
          href={`/empresa/${companyId}/inicio`}
          className={cn(
            'flex items-center py-1.5 rounded-md text-sm transition-colors',
            collapsed ? 'justify-center px-0 mx-1' : 'gap-2.5 px-2',
            pathname === `/empresa/${companyId}/inicio`
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <Home className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Início</span>}
        </Link>

        <Link
          href={`/empresa/${companyId}/workspaces`}
          className={cn(
            'flex items-center py-1.5 rounded-md text-sm transition-colors',
            collapsed ? 'justify-center px-0 mx-1' : 'gap-2.5 px-2',
            pathname === `/empresa/${companyId}/workspaces`
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Workspaces</span>}
        </Link>

        {isCompanyAdmin && (
          <Link
            href={`/empresa/${companyId}/membros`}
            className={cn(
              'flex items-center py-1.5 rounded-md text-sm transition-colors',
              collapsed ? 'justify-center px-0 mx-1' : 'gap-2.5 px-2',
              pathname.startsWith(`/empresa/${companyId}/membros`)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Users className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Membros</span>}
          </Link>
        )}

        {isCompanyAdmin && (
          <Link
            href={`/empresa/${companyId}/comunicado`}
            className={cn(
              'flex items-center py-1.5 rounded-md text-sm transition-colors',
              collapsed ? 'justify-center px-0 mx-1' : 'gap-2.5 px-2',
              pathname.startsWith(`/empresa/${companyId}/comunicado`)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Megaphone className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Comunicados</span>}
          </Link>
        )}

        {/* Workspaces section — hidden when collapsed */}
        {!collapsed && (
          <>
            <div className="pt-3 pb-1 flex items-center justify-between px-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Workspaces
              </span>
              {isCompanyAdmin && (
                <CreateWorkspaceInlineTrigger companyId={companyId} />
              )}
            </div>

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
          </>
        )}
      </nav>

      {/* Profile footer */}
      <div className="border-t">
        <Link
          href="/perfil"
          className={cn(
            'w-full flex items-center px-3 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
            collapsed ? 'justify-center' : 'gap-2.5',
          )}
        >
          <span className="relative shrink-0 h-7 w-7 rounded-full overflow-hidden
                           bg-muted flex items-center justify-center text-xs font-medium">
            {!avatarError && avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt="Avatar"
                className="h-full w-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span className="uppercase leading-none">
                {userEmail.charAt(0)}
              </span>
            )}
          </span>
          {!collapsed && (
            <>
              <span className="truncate text-xs font-medium flex-1">{userEmail}</span>
              <span className="text-xs text-muted-foreground shrink-0">Perfil</span>
            </>
          )}
        </Link>
      </div>
    </aside>
  );
}
