'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Megaphone, Users, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useMobileNav } from '@/components/navigation/sidebar-shell';

const navItems = [
  { href: '/superadmin/empresas', label: 'Empresas', icon: Building2 },
  { href: '/superadmin/usuarios', label: 'Usuários', icon: Users },
  { href: '/superadmin/broadcast', label: 'Comunicados', icon: Megaphone },
];

interface SuperadminSidebarProps {
  forceExpanded?: boolean;
  onNavigate?: () => void;
}

export function SuperadminSidebar({ forceExpanded, onNavigate }: SuperadminSidebarProps = {}) {
  const pathname = usePathname();
  const mobileNav = useMobileNav();

  const isDrawer = forceExpanded || mobileNav?.isDrawer;
  const handleNavigate = onNavigate ?? mobileNav?.close;

  const [collapsedState, setCollapsed] = useState(false);
  const collapsed = isDrawer ? false : collapsedState;

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 bg-muted/40 border-r flex flex-col transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      <div className="px-3 py-5 flex items-center justify-between min-h-[60px]">
        {!collapsed && (
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Superusuário
          </p>
        )}
        {!isDrawer && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md
                       text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </div>
      <Separator />
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={handleNavigate}
            className={cn(
              'flex items-center py-2 rounded-md text-sm font-medium transition-colors',
              collapsed ? 'justify-center px-0 mx-1' : 'gap-3 px-3',
              pathname.startsWith(href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {!collapsed && label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
