'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/superadmin/empresas', label: 'Empresas', icon: Building2 },
  { href: '/superadmin/usuarios', label: 'Usuários', icon: Users },
];

export function SuperadminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-muted/40 border-r flex flex-col">
      <div className="px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Superusuário
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
