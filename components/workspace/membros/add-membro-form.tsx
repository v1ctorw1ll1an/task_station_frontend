'use client';

import { useActionState, useEffect, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, UserPlus } from 'lucide-react';
import {
  addMembroAction,
  AddMembroActionState,
} from '@/actions/workspace/add-membro.action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserAvatar } from '@/components/ui/user-avatar';

interface AvailableMember {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
}

interface AddMembroFormProps {
  workspaceId: string;
  availableMembers: AvailableMember[];
}

const initialState: AddMembroActionState = {};

export function AddMembroForm({ workspaceId, availableMembers }: AddMembroFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(addMembroAction, initialState);
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<AvailableMember | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (state.success) {
      startTransition(() => {
        setOpen(false);
        setSelectedMember(null);
        setSearch('');
        router.refresh();
      });
    }
  }, [state.success, router]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      startTransition(() => {
        setSelectedMember(null);
        setSearch('');
        setDropdownOpen(false);
      });
    }
  }, [open]);

  const filtered = availableMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar membro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar membro ao workspace</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          {selectedMember && (
            <input type="hidden" name="userId" value={selectedMember.id} />
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Colaborador</label>

            {availableMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground border rounded-md px-3 py-2">
                Todos os colaboradores da empresa já fazem parte deste workspace.
              </p>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {selectedMember ? (
                    <span className="flex items-center gap-2 min-w-0">
                      <UserAvatar name={selectedMember.name} email={selectedMember.email} photoUrl={selectedMember.photoUrl} size="xs" />
                      <span className="truncate">
                        {selectedMember.name}{' '}
                        <span className="text-muted-foreground">({selectedMember.email})</span>
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Selecionar colaborador...</span>
                  )}
                  <span className="text-muted-foreground text-xs shrink-0 ml-1">▾</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md">
                    <div className="p-2 border-b">
                      <Input
                        autoFocus
                        placeholder="Buscar por nome ou email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto py-1">
                      {filtered.length === 0 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                          Nenhum colaborador encontrado
                        </p>
                      )}
                      {filtered.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => {
                            setSelectedMember(member);
                            setDropdownOpen(false);
                            setSearch('');
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                        >
                          <UserAvatar name={member.name} email={member.email} photoUrl={member.photoUrl} size="sm" />
                          <span className="flex flex-col items-start min-w-0">
                            <span className="font-medium truncate">{member.name}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {member.email}
                            </span>
                          </span>
                          {selectedMember?.id === member.id && (
                            <Check className="h-3.5 w-3.5 ml-auto shrink-0 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
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
            <Button type="submit" disabled={isPending || !selectedMember}>
              {isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
