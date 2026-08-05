'use client';

import { LogOut, ChevronDown, Building2, LayoutDashboard, Info, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/actions/logout.action';
import { useTourStore } from '@/lib/stores/tour-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  email: string;
  isSuperuser?: boolean;
}

export function EmpresaUserMenu({ email, isSuperuser = false }: UserMenuProps) {
  const router = useRouter();
  const startTour = useTourStore((s) => s.start);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-sm shrink-0">
          {/* Mobile: initial circle */}
          <span
            className="md:hidden h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0"
            aria-hidden
          >
            {email[0]?.toUpperCase()}
          </span>
          {/* Desktop: email with truncation */}
          <span className="hidden md:block text-foreground font-medium truncate max-w-[160px]">
            {email}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/empresa/selecionar')}>
          <Building2 className="h-4 w-4" />
          Trocar empresa
        </DropdownMenuItem>
        {isSuperuser && (
          <DropdownMenuItem onClick={() => router.push('/superadmin/empresas')}>
            <LayoutDashboard className="h-4 w-4" />
            Painel do superusuário
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => startTour()}>
          <GraduationCap className="h-4 w-4" />
          Ver tutorial
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/sobre')}>
          <Info className="h-4 w-4" />
          Sobre o sistema
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logoutAction()}>
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
