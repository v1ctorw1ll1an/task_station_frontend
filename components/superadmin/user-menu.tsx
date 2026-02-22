'use client';

import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, Building2 } from 'lucide-react';
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
  hasCompanies?: boolean;
}

export function UserMenu({ email, hasCompanies = false }: UserMenuProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-sm">
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{email}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/superadmin/perfil')}>
          <User className="h-4 w-4" />
          Meu perfil
        </DropdownMenuItem>
        {hasCompanies && (
          <DropdownMenuItem onClick={() => router.push('/empresa/selecionar')}>
            <Building2 className="h-4 w-4" />
            Minhas empresas
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => logoutAction()}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
