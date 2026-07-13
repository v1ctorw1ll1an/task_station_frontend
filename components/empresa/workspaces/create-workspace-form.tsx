'use client';

import { useEffect, useActionState, useState, useRef, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, X, ChevronDown, Check, CheckCircle } from 'lucide-react';
import {
  createWorkspaceAction,
  CreateWorkspaceActionState,
} from '@/actions/empresa/create-workspace.action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Member {
  id: string;
  name: string;
  email: string;
}

interface CreateWorkspaceFormProps {
  companyId: string;
  companyMembers: Member[];
}

const initialState: CreateWorkspaceActionState = {};

export function CreateWorkspaceForm({ companyId, companyMembers }: CreateWorkspaceFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createWorkspaceAction, initialState);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.success) {
      startTransition(() => {
        setOpen(false);
        setSuccessMessage(state.workspaceName ?? 'Workspace criado com sucesso!');
        // Reflete a criação na sidebar imediatamente (mesmo evento do criador inline),
        // sem esperar o round-trip do router.refresh().
        if (state.workspaceId && state.workspaceName) {
          window.dispatchEvent(
            new CustomEvent('workspace:created', {
              detail: {
                workspaceId: state.workspaceId,
                workspaceName: state.workspaceName,
                companyId,
              },
            }),
          );
        }
        router.refresh();
      });
    }
  }, [state.success, state.workspaceName, state.workspaceId, companyId, router]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIds([]);
       
      setSearch('');
       
      setDropdownOpen(false);
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = companyMembers.filter((m) => {
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => setSelectedIds(companyMembers.map((m) => m.id));
  const clearAll = () => setSelectedIds([]);

  const selectedMembers = companyMembers.filter((m) => selectedIds.includes(m.id));

  return (
    <>
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-md dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>
            Workspace <strong>{successMessage}</strong> criado com sucesso!
          </span>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo workspace
          </Button>
        </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar workspace</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="companyId" value={companyId} />
          {selectedIds.map((id) => (
            <input key={id} type="hidden" name="memberIds[]" value={id} />
          ))}

          <div className="space-y-2">
            <Label htmlFor="name">Nome do workspace</Label>
            <Input id="name" name="name" placeholder="Ex: Desenvolvimento" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input id="description" name="description" placeholder="Descrição do workspace" />
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Membros do workspace
              </p>
              {companyMembers.length > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-primary hover:underline"
                  >
                    Adicionar todos
                  </button>
                  {selectedIds.length > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">·</span>
                      <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Limpar
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {companyMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum colaborador cadastrado na empresa.
              </p>
            ) : (
              <div className="space-y-2" ref={dropdownRef}>
                <div
                  className="flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 min-h-9"
                  onClick={() => setDropdownOpen((v) => !v)}
                >
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length === 0
                      ? 'Selecionar membros...'
                      : `${selectedIds.length} membro${selectedIds.length > 1 ? 's' : ''} selecionado${selectedIds.length > 1 ? 's' : ''}`}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>

                {dropdownOpen && (
                  <div className="border rounded-md shadow-md bg-background z-50">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Buscar colaborador..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filtered.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-3">
                          Nenhum resultado
                        </p>
                      ) : (
                        filtered.map((m) => {
                          const isSelected = selectedIds.includes(m.id);
                          return (
                            <div
                              key={m.id}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                              onClick={() => toggle(m.id)}
                            >
                              <div className="flex h-4 w-4 items-center justify-center rounded border border-primary">
                                {isSelected && <Check className="h-3 w-3 text-primary" />}
                              </div>
                              <span className="text-sm">
                                {m.name}{' '}
                                <span className="text-muted-foreground">({m.email})</span>
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedMembers.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 bg-muted rounded-full px-2 py-0.5 text-xs"
                      >
                        {m.name}
                        <button
                          type="button"
                          onClick={() => toggle(m.id)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Criando...' : 'Criar workspace'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
