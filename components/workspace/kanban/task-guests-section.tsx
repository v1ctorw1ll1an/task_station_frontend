'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Check, ChevronDown, Copy, Loader2, Trash2, UserCircle2, UserPlus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { setGuestLinkAction } from '@/actions/projeto/set-guest-link.action';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { addGuestAction } from '@/actions/projeto/add-guest.action';
import {
  listGuestsAction,
  type TaskGuestSummary,
} from '@/actions/projeto/list-guests.action';
import { revokeGuestAction } from '@/actions/projeto/revoke-guest.action';
import {
  searchGuestsAction,
  type GuestSearchResult,
} from '@/actions/projeto/search-guests.action';
import { AddGuestDialog } from './add-guest-dialog';

interface TaskGuestsSectionProps {
  projectId: string;
  taskId: string;
}

function formatPhone(e164: string): string {
  const digits = e164.replace(/\D+/g, '');
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return e164;
}

function initialOf(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  return (first[0] ?? '?').toUpperCase();
}

export function TaskGuestsSection({ projectId, taskId }: TaskGuestsSectionProps) {
  const [guests, setGuests] = useState<TaskGuestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<GuestSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addPending, startAdd] = useTransition();

  const [revokeTarget, setRevokeTarget] = useState<TaskGuestSummary | null>(null);
  const [revokePending, startRevoke] = useTransition();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchGuests = useCallback(() => {
    listGuestsAction(projectId, taskId).then((res) => {
      if (res.error) {
        setError(res.error);
        setGuests([]);
      } else {
        setGuests(res.guests ?? []);
      }
      setLoading(false);
    });
  }, [projectId, taskId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetchGuests();
  }, [fetchGuests]);

  // Debounce search ao abrir / digitar
  useEffect(() => {
    if (!dropdownOpen) return;
    const term = search;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearching(true);
    const id = setTimeout(() => {
      searchGuestsAction(projectId, taskId, term).then((res) => {
        if (res.results) setResults(res.results);
        else setResults([]);
        setSearching(false);
      });
    }, 200);
    return () => clearTimeout(id);
  }, [dropdownOpen, search, projectId, taskId]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const linkedPhones = useMemo(() => new Set(guests.map((g) => g.phoneE164)), [guests]);

  const handlePickExisting = useCallback(
    (guest: GuestSearchResult) => {
      if (linkedPhones.has(guest.phoneE164)) return;
      startAdd(async () => {
        const form = new FormData();
        form.set('projectId', projectId);
        form.set('taskId', taskId);
        form.set('name', guest.name);
        form.set('phone', guest.phoneE164);
        if (guest.email) form.set('email', guest.email);
        const res = await addGuestAction({}, form);
        if (res.error) {
          setError(res.error);
        } else if (res.whatsappUrl) {
          window.open(res.whatsappUrl, '_blank', 'noopener,noreferrer');
          fetchGuests();
          setDropdownOpen(false);
          setSearch('');
        }
      });
    },
    [projectId, taskId, fetchGuests, linkedPhones],
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleCopyLink = useCallback(async (guest: TaskGuestSummary) => {
    if (!guest.publicUrl) return;
    try {
      await navigator.clipboard.writeText(guest.publicUrl);
      setCopiedId(guest.id);
      setTimeout(() => setCopiedId((id) => (id === guest.id ? null : id)), 1500);
    } catch {
      setError('Não foi possível copiar o link');
    }
  }, []);

  const handleToggleLink = useCallback(
    async (guest: TaskGuestSummary, enabled: boolean) => {
      setTogglingId(guest.id);
      setGuests((prev) => prev.map((g) => (g.id === guest.id ? { ...g, linkEnabled: enabled } : g)));
      const res = await setGuestLinkAction(projectId, taskId, guest.id, enabled);
      setTogglingId(null);
      if (res.error) {
        setError(res.error);
        setGuests((prev) =>
          prev.map((g) => (g.id === guest.id ? { ...g, linkEnabled: !enabled } : g)),
        );
      }
    },
    [projectId, taskId],
  );

  const handleRevoke = useCallback(() => {
    if (!revokeTarget) return;
    const guestId = revokeTarget.id;
    startRevoke(async () => {
      const res = await revokeGuestAction(projectId, taskId, guestId);
      if (res.error) {
        setError(res.error);
      } else {
        setGuests((prev) => prev.filter((g) => g.id !== guestId));
      }
      setRevokeTarget(null);
    });
  }, [projectId, taskId, revokeTarget]);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Convidados {guests.length > 0 && `(${guests.length})`}
      </p>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-xs hover:bg-accent"
        >
          <span className="text-muted-foreground">
            {addPending ? 'Adicionando…' : 'Adicionar convidado…'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {dropdownOpen && (
          <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md">
            <div className="p-2 border-b">
              <Input
                placeholder="Buscar por nome, telefone ou email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 text-xs"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  setCreateDialogOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-primary cursor-pointer border-b"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Cadastrar novo convidado
              </button>

              {searching && (
                <p className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Buscando…
                </p>
              )}

              {!searching && results.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Nenhum convidado encontrado neste workspace
                </p>
              )}

              {!searching &&
                results.map((r) => {
                  const alreadyLinked = linkedPhones.has(r.phoneE164);
                  return (
                    <button
                      key={r.phoneE164}
                      type="button"
                      disabled={alreadyLinked || addPending}
                      onClick={() => handlePickExisting(r)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {initialOf(r.name)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col items-start">
                        <span className="truncate font-medium">{r.name}</span>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {formatPhone(r.phoneE164)}
                          {r.email ? ` · ${r.email}` : ''}
                        </span>
                      </span>
                      {alreadyLinked && (
                        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                          já nesta task
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando…
        </div>
      ) : guests.length > 0 ? (
        <ul className="space-y-1">
          {guests.map((guest) => (
            <li
              key={guest.id}
              className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {initialOf(guest.name)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-medium">{guest.name}</span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {formatPhone(guest.phoneE164)}
                  {guest.email ? ` · ${guest.email}` : ''}
                  {!guest.linkEnabled && (
                    <span className="ml-1 text-amber-600 dark:text-amber-500">· link desativado</span>
                  )}
                </span>
              </div>

              {guest.canManage && guest.publicUrl && (
                <button
                  type="button"
                  onClick={() => handleCopyLink(guest)}
                  className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  title="Copiar link público"
                  aria-label={`Copiar link de ${guest.name}`}
                >
                  {copiedId === guest.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              )}

              {guest.canManage && (
                <Switch
                  checked={guest.linkEnabled}
                  disabled={togglingId === guest.id}
                  onCheckedChange={(v) => handleToggleLink(guest, v)}
                  title={guest.linkEnabled ? 'Desabilitar link público' : 'Habilitar link público'}
                  aria-label={`Alternar link público de ${guest.name}`}
                />
              )}

              <button
                type="button"
                onClick={() => setRevokeTarget(guest)}
                className="rounded p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                title="Revogar acesso"
                aria-label={`Revogar acesso de ${guest.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4" />
              Revogar acesso
            </AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget?.name} não conseguirá mais acessar esta task pelo link
              público. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokePending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revokePending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokePending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddGuestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        taskId={taskId}
        onCreated={fetchGuests}
      />
    </div>
  );
}
