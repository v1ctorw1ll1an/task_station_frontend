'use client';

import { useMemo, useState } from 'react';
import { Check, Search, Users, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface MemberOption {
  userId: string;
  userName: string;
  userPhotoUrl: string | null;
}

interface MemberFilterProps {
  members: MemberOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export function MemberFilter({ members, selectedIds, onChange }: MemberFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const sorted = useMemo(
    () => [...members].sort((a, b) => a.userName.localeCompare(b.userName, 'pt-BR')),
    [members],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((m) => m.userName.toLowerCase().includes(q));
  }, [sorted, query]);

  const allSelected = selectedIds.length === 0;
  const selectedCount = selectedIds.length;

  function toggle(userId: string) {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            <span>Filtrar membros</span>
            {selectedCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar membro…"
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
            <span className="text-xs text-muted-foreground">
              {allSelected ? 'Mostrando todos' : `${selectedCount} selecionado${selectedCount !== 1 ? 's' : ''}`}
            </span>
            {!allSelected && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-primary hover:underline"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-center text-muted-foreground">
                Nenhum membro encontrado.
              </p>
            ) : (
              filtered.map((m) => {
                const isSelected = selectedIds.includes(m.userId);
                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => toggle(m.userId)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent/50 transition-colors text-left',
                      isSelected && 'bg-accent/30',
                    )}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                      {getInitials(m.userName)}
                    </div>
                    <span className="flex-1 truncate">{m.userName}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-8 px-2 text-xs text-muted-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
