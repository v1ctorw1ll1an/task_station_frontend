'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface EmpresaSidebarProps {
  companyId: string;
  companyName: string;
  role: string;
}

export function EmpresaSidebar({ companyId, companyName, role }: EmpresaSidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === 'admin';

  const navItems = [
    { href: `/empresa/${companyId}/workspaces`, label: 'Workspaces', icon: LayoutGrid },
    ...(isAdmin ? [{ href: `/empresa/${companyId}/membros`, label: 'Membros', icon: Users }] : []),
  ];

  return (
    <aside className="w-56 min-h-screen bg-muted/40 border-r flex flex-col">
      <div className="px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Empresa
        </p>
        <p className="text-sm font-medium mt-1 truncate" title={companyName}>
          {companyName}
        </p>
      </div>
      <Separator />
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
