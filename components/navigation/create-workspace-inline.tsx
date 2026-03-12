'use client';

import { useState, useEffect, useActionState, useRef, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, ChevronDown, Check, CheckCircle } from 'lucide-react';
import {
  createWorkspaceAction,
  CreateWorkspaceActionState,
} from '@/actions/empresa/create-workspace.action';
import {
  CompanyMember,
  getCompanyMembersAction,
} from '@/actions/empresa/get-company-members.action';
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

interface CreateWorkspaceInlineTriggerProps {
  companyId: string;
  variant?: 'icon' | 'button';
}

const initialState: CreateWorkspaceActionState = {};

export function CreateWorkspaceInlineTrigger({
  companyId,
  variant = 'icon',
}: CreateWorkspaceInlineTriggerProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createWorkspaceAction, initialState);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.success) {
      startTransition(() => {
        setOpen(false);
        setSuccessMessage(state.workspaceName ?? 'Workspace criado!');
        router.refresh();
      });
    }
  }, [state.success, state.workspaceName, router]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (open) {
      getCompanyMembersAction(companyId).then(setCompanyMembers);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIds([]);
       
      setSearch('');
       
      setDropdownOpen(false);
    }
  }, [open, companyId]);

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

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectedMembers = companyMembers.filter((m) => selectedIds.includes(m.id));

  const trigger =
    variant === 'button' ? (
      <Button size="sm" variant="outline" className="w-full text-xs h-8">
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Novo workspace
      </Button>
    ) : (
      <button
        title="Novo workspace"
        className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    );

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
        <DialogTrigger asChild>{trigger}</DialogTrigger>
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
            <Label htmlFor="ws-name">Nome do workspace</Label>
            <Input id="ws-name" name="name" placeholder="Ex: Desenvolvimento" required autoFocus />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ws-description">Descrição (opcional)</Label>
            <Input id="ws-description" name="description" placeholder="Descrição do workspace" />
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
                    onClick={() => setSelectedIds(companyMembers.map((m) => m.id))}
                    className="text-xs text-primary hover:underline"
                  >
                    Adicionar todos
                  </button>
                  {selectedIds.length > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">·</span>
                      <button
                        type="button"
                        onClick={() => setSelectedIds([])}
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
