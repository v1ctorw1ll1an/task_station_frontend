'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ICON_MAP, FEATURED_ICONS, DEFAULT_ICON } from '@/lib/icons/project-icons';

const COLORS: (string | null)[] = [
  null, // tema (preto/branco conforme light/dark mode)
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#64748b', '#1d4ed8',
];

interface ProjectIconPickerProps {
  icon: string;
  color: string | null;
  onChange: (icon: string, color: string | null) => void;
}

export function ProjectIconPicker({ icon, color, onChange }: ProjectIconPickerProps) {
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogQuery, setDialogQuery] = useState('');

  const PreviewIcon = ICON_MAP[icon] ?? ICON_MAP[DEFAULT_ICON];

  const filteredIcons = useMemo(() => {
    if (!query.trim()) return FEATURED_ICONS;
    const q = query.toLowerCase();
    return Object.keys(ICON_MAP).filter((name) => name.toLowerCase().includes(q));
  }, [query]);

  const dialogIcons = useMemo(() => {
    if (!dialogQuery.trim()) return Object.keys(ICON_MAP);
    const q = dialogQuery.toLowerCase();
    return Object.keys(ICON_MAP).filter((name) => name.toLowerCase().includes(q));
  }, [dialogQuery]);

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted"
          style={color ? { color } : undefined}
        >
          <PreviewIcon className="h-5 w-5" />
        </div>
        <span className="text-sm text-muted-foreground">{icon}</span>
      </div>

      {/* Color swatches */}
      <div className="flex flex-wrap gap-2">
        {COLORS.map((c) =>
          c === null ? (
            <button
              key="theme"
              type="button"
              title="Cor do tema"
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 bg-gradient-to-br from-foreground/80 to-foreground/30',
                color === null ? 'border-foreground scale-110' : 'border-transparent',
              )}
              onClick={() => onChange(icon, null)}
            />
          ) : (
            <button
              key={c}
              type="button"
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                color === c ? 'border-foreground scale-110' : 'border-transparent',
              )}
              style={{ backgroundColor: c }}
              onClick={() => onChange(icon, c)}
            />
          ),
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8 text-sm h-8"
          placeholder="Buscar ícone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Icon grid */}
      <div className="grid grid-cols-8 gap-1 max-h-[140px] overflow-y-auto">
        {filteredIcons.map((name) => {
          const Icon = ICON_MAP[name];
          if (!Icon) return null;
          return (
            <button
              key={name}
              type="button"
              title={name}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-muted',
                icon === name ? 'ring-2 ring-primary border-primary' : 'border-transparent',
              )}
              style={icon === name && color ? { color } : undefined}
              onClick={() => onChange(name, color)}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      {/* Ver todos */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-muted-foreground"
        onClick={() => { setDialogQuery(''); setDialogOpen(true); }}
      >
        Ver todos os ícones →
      </Button>

      {/* All icons dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Selecionar ícone</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8 text-sm"
                placeholder="Buscar ícone..."
                value={dialogQuery}
                onChange={(e) => setDialogQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-6 gap-1 max-h-[400px] overflow-y-auto">
              {dialogIcons.map((name) => {
                const Icon = ICON_MAP[name];
                if (!Icon) return null;
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-md p-2 text-[10px] transition-colors hover:bg-muted',
                      icon === name ? 'ring-2 ring-primary bg-muted' : '',
                    )}
                    style={icon === name && color ? { color } : undefined}
                    onClick={() => {
                      onChange(name, color);
                      setDialogOpen(false);
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="truncate w-full text-center text-muted-foreground leading-none">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
