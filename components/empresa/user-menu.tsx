'use client';

import { useEffect, useState } from 'react';
import { LogOut, ChevronDown, Building2, LayoutDashboard, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/actions/logout.action';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Static placeholder during SSR to avoid Radix ID hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="gap-2 text-sm">
        <span className="text-foreground font-medium">{email}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-sm">
          <span className="text-foreground font-medium">{email}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
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
