'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { BROWSER_TZ, combineDateAndTime, dateInTz, formatTaskTime } from '@/lib/datetime';
import { MarkdownEditor, MarkdownDisplay } from '@/components/workspace/kanban/markdown-editor';
import {
  updatePublicTaskAction,
  type UpdatePublicTaskFields,
} from '@/actions/projeto/update-public-task.action';
import {
  getPublicTaskAction,
  type PublicTask,
  type PublicTaskColumn,
  type PublicTaskLabel,
} from '@/actions/projeto/get-public-task.action';
import {
  getPublicColumnsAction,
  getPublicLabelsAction,
} from '@/actions/projeto/public-task-meta.actions';
import {
  createPublicChecklistAction,
  deletePublicChecklistAction,
  getPublicChecklistsAction,
  reorderPublicChecklistAction,
  updatePublicChecklistAction,
} from '@/actions/projeto/public-checklist.actions';
import {
  createPublicCommentAction,
  deletePublicCommentAction,
  getPublicCommentsAction,
  updatePublicCommentAction,
  type PublicComment,
} from '@/actions/projeto/public-comment.actions';
import {
  getPublicHistoryAction,
  type PublicHistoryEntry,
} from '@/actions/projeto/public-history.action';
import type { PublicTaskChecklist } from '@/actions/projeto/get-public-task.action';
import { usePublicTaskSocket } from '@/hooks/use-public-task-socket';
import { TASK_HISTORY_MAX, FREE } from '@/lib/limits';

interface PublicTaskViewProps {
  token: string;
  initialTask: PublicTask;
}

type Priority = PublicTask['priority'];

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string }> = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

const FIELD_LABELS: Record<string, string> = {
  title: 'Título',
  description: 'Descrição',
  priority: 'Prioridade',
  startDate: 'Início',
  dueDate: 'Vencimento',
  columnId: 'Status',
  column: 'Status',
  labels: 'Labels',
  assignees: 'Responsáveis',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PublicTaskView({ token, initialTask }: PublicTaskViewProps) {
  const [task, setTask] = useState<PublicTask>(initialTask);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // Rascunho local de todos os campos editáveis — só é enviado ao servidor no "Salvar".
  const [title, setTitle] = useState(initialTask.title);
  const [description, setDescription] = useState(initialTask.description ?? '');
  const [priority, setPriority] = useState<Priority>(initialTask.priority);
  const [columnId, setColumnId] = useState(initialTask.column.id);
  const [startDate, setStartDate] = useState(dateInTz(initialTask.startDate, initialTask.timezone));
  const [startTime, setStartTime] = useState(formatTaskTime(initialTask.startDate, initialTask.timezone));
  const [dueDate, setDueDate] = useState(dateInTz(initialTask.dueDate, initialTask.timezone));
  const [dueTime, setDueTime] = useState(formatTaskTime(initialTask.dueDate, initialTask.timezone));
  const [labelIds, setLabelIds] = useState<string[]>(initialTask.labels.map((l) => l.id));

  const [columns, setColumns] = useState<PublicTaskColumn[]>([]);
  const [palette, setPalette] = useState<PublicTaskLabel[]>([]);
  const [checklists, setChecklists] = useState<PublicTaskChecklist[]>(initialTask.checklists);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [history, setHistory] = useState<PublicHistoryEntry[]>([]);

  const seedDraft = useCallback((t: PublicTask) => {
    setTitle(t.title);
    setDescription(t.description ?? '');
    setPriority(t.priority);
    setColumnId(t.column.id);
    setStartDate(dateInTz(t.startDate, t.timezone));
    setStartTime(formatTaskTime(t.startDate, t.timezone));
    setDueDate(dateInTz(t.dueDate, t.timezone));
    setDueTime(formatTaskTime(t.dueDate, t.timezone));
    setLabelIds(t.labels.map((l) => l.id));
  }, []);

  const sameLabels = (a: string[], b: string[]) =>
    a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',');

  // Combina data + hora no TZ da task; compara instantes normalizados.
  const tz = task.timezone || BROWSER_TZ;
  const normIso = (iso: string | null) => (iso ? new Date(iso).toISOString() : null);
  // Hora zerada/vazia = "sem horário"; allDay derivado disso (sem toggle na UI).
  const allDay = !startTime && !dueTime;
  const draftStartIso = startDate ? combineDateAndTime(startDate, startTime, allDay, tz) : null;
  const draftDueIso = dueDate ? combineDateAndTime(dueDate, dueTime, allDay, tz) : null;

  const isDirty =
    title.trim() !== task.title ||
    description !== (task.description ?? '') ||
    priority !== task.priority ||
    columnId !== task.column.id ||
    allDay !== task.allDay ||
    normIso(draftStartIso) !== normIso(task.startDate) ||
    normIso(draftDueIso) !== normIso(task.dueDate) ||
    !sameLabels(labelIds, task.labels.map((l) => l.id));

  // Ref para ler isDirty dentro de callbacks (socket) sem stale closure.
  const isDirtyRef = useRef(false);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const refetchTask = useCallback(async () => {
    const res = await getPublicTaskAction(token);
    if (res.task) {
      setTask(res.task);
      setChecklists(res.task.checklists);
      // Não sobrescreve edições locais ainda não salvas.
      if (!isDirtyRef.current) seedDraft(res.task);
    }
  }, [token, seedDraft]);

  const refetchChecklists = useCallback(async () => {
    const res = await getPublicChecklistsAction(token);
    if (res.items) setChecklists(res.items);
  }, [token]);

  const refetchComments = useCallback(async () => {
    const res = await getPublicCommentsAction(token);
    if (res.comments) setComments(res.comments);
  }, [token]);

  const refetchHistory = useCallback(async () => {
    const res = await getPublicHistoryAction(token, 1, TASK_HISTORY_MAX);
    if (res.history) setHistory(res.history.data);
  }, [token]);

  useEffect(() => {
    getPublicColumnsAction(token).then((r) => r.columns && setColumns(r.columns));
    getPublicLabelsAction(token).then((r) => r.labels && setPalette(r.labels));
    getPublicCommentsAction(token).then((r) => r.comments && setComments(r.comments));
    getPublicHistoryAction(token, 1, TASK_HISTORY_MAX).then((r) => r.history && setHistory(r.history.data));
  }, [token]);

  // Realtime: qualquer mudança (equipe ou outro convidado) refaz os dados.
  const onChanged = useCallback(() => {
    refetchTask();
    refetchComments();
    refetchHistory();
  }, [refetchTask, refetchComments, refetchHistory]);
  usePublicTaskSocket(token, onChanged);

  // Avisa se sair com alterações não salvas.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSave = () => {
    if (!isDirty || pending) return;
    if (!title.trim()) {
      setError('O título não pode ficar vazio');
      return;
    }
    const fields: UpdatePublicTaskFields = {};
    if (title.trim() !== task.title) fields.title = title.trim();
    if (description !== (task.description ?? '')) fields.description = description || null;
    if (priority !== task.priority) fields.priority = priority;
    if (columnId !== task.column.id) fields.columnId = columnId;
    const startChanged = normIso(draftStartIso) !== normIso(task.startDate);
    const dueChanged = normIso(draftDueIso) !== normIso(task.dueDate);
    if (startChanged) fields.startDate = draftStartIso;
    if (dueChanged) fields.dueDate = draftDueIso;
    if (allDay !== task.allDay) fields.allDay = allDay;
    if (startChanged || dueChanged || allDay !== task.allDay) fields.timezone = tz;
    if (!sameLabels(labelIds, task.labels.map((l) => l.id))) fields.labelIds = labelIds;

    setError(null);
    startTransition(async () => {
      const res = await updatePublicTaskAction(token, fields);
      if (res.error || !res.task) {
        setError(res.error ?? 'Erro ao salvar');
        return;
      }
      setTask(res.task);
      setChecklists(res.task.checklists);
      seedDraft(res.task);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
      refetchHistory();
    });
  };

  const toggleLabel = (labelId: string) => {
    setLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  };

  const youGuest = task.guests.find((g) => g.isYou);
  const selectedLabelIds = new Set(labelIds);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {task.taskNumber ? `#${task.taskNumber}` : 'Task'}
          {' · '}
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
            {task.column.name}
          </span>
        </span>
        {pending ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            salvando…
          </span>
        ) : savedFlash ? (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <Check className="h-3 w-3" />
            salvo
          </span>
        ) : null}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-md border bg-card p-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="public-title" className="text-xs uppercase tracking-wide text-muted-foreground">
            Título
          </Label>
          <Input
            id="public-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={pending}
            maxLength={255}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="public-desc" className="text-xs uppercase tracking-wide text-muted-foreground">
            Descrição
          </Label>
          <MarkdownEditor
            value={description}
            onChange={setDescription}
            placeholder="Sem descrição"
            collapsible
            resizable
            minRows={8}
            maxLength={FREE.taskDescription}
            disabled={pending}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Status</Label>
            <Select value={columnId} onValueChange={setColumnId} disabled={pending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Prioridade</Label>
            <Select
              value={priority}
              onValueChange={(value: Priority) => setPriority(value)}
              disabled={pending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Início</Label>
            <DatePicker value={startDate} onChange={(v) => setStartDate(v)} disabled={pending} />
            {startDate && (
              <TimePicker value={startTime} onChange={setStartTime} disabled={pending} />
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Vencimento</Label>
            <DatePicker value={dueDate} onChange={(v) => setDueDate(v)} disabled={pending} />
            {dueDate && (
              <TimePicker value={dueTime} onChange={setDueTime} disabled={pending} />
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-3">
          {isDirty && <span className="text-[11px] text-amber-600">alterações não salvas</span>}
          <Button type="button" size="sm" onClick={handleSave} disabled={!isDirty || pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {/* Labels */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Labels</p>
        {palette.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma label disponível.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {palette.map((label) => {
              const active = selectedLabelIds.has(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  disabled={pending}
                  onClick={() => toggleLabel(label.id)}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-opacity ${
                    active ? '' : 'opacity-40 hover:opacity-70'
                  }`}
                  style={{ backgroundColor: `${label.color}20`, color: label.color }}
                >
                  {active && <Check className="h-3 w-3" />}
                  {label.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Checklist */}
      <ChecklistSection
        token={token}
        items={checklists}
        setItems={setChecklists}
        onChanged={refetchChecklists}
      />

      {/* Comentários */}
      <CommentsSection
        token={token}
        comments={comments}
        onChanged={refetchComments}
      />

      {/* Histórico */}
      <HistorySection entries={history} />

      {task.guests.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Convidados</p>
          <div className="flex flex-wrap gap-2">
            {task.guests.map((g) => (
              <div
                key={g.id}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
                  g.isYou ? 'border-primary bg-primary/10 text-primary' : 'bg-card'
                }`}
              >
                {g.name}
                {g.isYou && <span className="text-[9px] uppercase tracking-wide">(você)</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {youGuest && (
        <p className="pt-2 text-center text-[10px] text-muted-foreground">
          Você está acessando esta task como convidado. Suas alterações ficam visíveis para a
          equipe.
        </p>
      )}
    </div>
  );
}

// ── Checklist ─────────────────────────────────────────────────────────────────

function ChecklistSection({
  token,
  items,
  setItems,
  onChanged,
}: {
  token: string;
  items: PublicTaskChecklist[];
  setItems: (items: PublicTaskChecklist[]) => void;
  onChanged: () => void;
}) {
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const sorted = [...items].sort((a, b) => a.order - b.order);
  const total = sorted.length;
  const done = sorted.filter((i) => i.completed).length;

  const add = async () => {
    const t = newTitle.trim();
    if (!t || busy) return;
    setBusy(true);
    const res = await createPublicChecklistAction(token, t);
    setBusy(false);
    if (res.item) {
      setNewTitle('');
      onChanged();
    }
  };

  const toggle = async (item: PublicTaskChecklist) => {
    setItems(items.map((i) => (i.id === item.id ? { ...i, completed: !i.completed } : i)));
    await updatePublicChecklistAction(token, item.id, { completed: !item.completed });
    onChanged();
  };

  const saveEdit = async (id: string) => {
    const t = editTitle.trim();
    setEditingId(null);
    if (!t) return;
    await updatePublicChecklistAction(token, id, { title: t });
    onChanged();
  };

  const remove = async (id: string) => {
    await deletePublicChecklistAction(token, id);
    onChanged();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= sorted.length) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(next, 0, moved);
    setItems(reordered.map((it, i) => ({ ...it, order: i + 1 })));
    await reorderPublicChecklistAction(
      token,
      reordered.map((it, i) => ({ id: it.id, order: i + 1 })),
    );
    onChanged();
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Checklist {total > 0 && <span className="normal-case">({done}/{total})</span>}
      </p>
      <ul className="space-y-1 rounded-md border bg-card p-3">
        {sorted.map((item, index) => (
          <li key={item.id} className="flex items-center gap-2 text-sm group">
            <button
              type="button"
              onClick={() => toggle(item)}
              className={`shrink-0 inline-flex h-4 w-4 items-center justify-center rounded border ${
                item.completed ? 'bg-primary text-primary-foreground' : 'bg-background'
              }`}
            >
              {item.completed && <Check className="h-3 w-3" />}
            </button>
            {editingId === item.id ? (
              <Input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => saveEdit(item.id)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                className="h-7 flex-1"
              />
            ) : (
              <span
                className={`flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}
              >
                {item.title}
              </span>
            )}
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
              <button type="button" onClick={() => move(index, -1)} title="Subir" className="p-0.5 text-muted-foreground hover:text-foreground">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => move(index, 1)} title="Descer" className="p-0.5 text-muted-foreground hover:text-foreground">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(item.id);
                  setEditTitle(item.title);
                }}
                title="Editar"
                className="p-0.5 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => remove(item.id)} title="Excluir" className="p-0.5 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </li>
        ))}
        {total === 0 && <li className="text-xs text-muted-foreground">Nenhum item.</li>}
        <li className="flex items-center gap-2 pt-1">
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Adicionar item"
            className="h-7 flex-1"
            disabled={busy}
          />
        </li>
      </ul>
    </div>
  );
}

// ── Comentários ─────────────────────────────────────────────────────────────────

function CommentsSection({
  token,
  comments,
  onChanged,
}: {
  token: string;
  comments: PublicComment[];
  onChanged: () => void;
}) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const formRef = useRef<HTMLTextAreaElement>(null);

  const submit = async () => {
    const v = value.trim();
    if (!v || busy) return;
    setBusy(true);
    const res = await createPublicCommentAction(token, v);
    setBusy(false);
    if (res.comment) {
      setValue('');
      onChanged();
    }
  };

  const saveEdit = async (id: string) => {
    const v = editValue.trim();
    setEditingId(null);
    if (!v) return;
    await updatePublicCommentAction(token, id, v);
    onChanged();
  };

  const remove = async (id: string) => {
    await deletePublicCommentAction(token, id);
    onChanged();
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Comentários</p>
      <div className="space-y-3 rounded-md border bg-card p-3">
        {comments.length === 0 && <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>}
        {comments.map((c) => (
          <div key={c.id} className="text-sm">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-xs">{c.author}</span>
              {c.isGuest && (
                <span className="rounded bg-emerald-500/10 px-1 text-[9px] font-medium uppercase tracking-wide text-emerald-600">
                  convidado
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">
                {formatDateTime(c.createdAt)}
                {c.updatedAt !== c.createdAt && ' (editado)'}
              </span>
            </div>
            {editingId === c.id ? (
              <div className="mt-1 space-y-1.5">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex gap-1.5">
                  <Button type="button" size="sm" className="h-6 text-xs px-2" onClick={() => saveEdit(c.id)}>
                    Salvar
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-0.5 flex items-start justify-between gap-2">
                <div className="min-w-0 break-words text-sm">
                  <MarkdownDisplay content={c.content} />
                </div>
                {c.isYou && (
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      title="Editar"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditValue(c.content);
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button type="button" title="Excluir" onClick={() => remove(c.id)} className="p-1 text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="flex items-end gap-2 pt-1">
          <textarea
            ref={formRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={2}
            placeholder="Escreva um comentário…"
            className="flex-1 rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="button" size="sm" onClick={submit} disabled={busy || !value.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Histórico ─────────────────────────────────────────────────────────────────

function HistorySection({ entries }: { entries: PublicHistoryEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Histórico</p>
      <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border bg-card p-3">
        {entries.map((e) => (
          <div key={e.id} className="text-xs">
            <span className="font-medium">{e.author}</span>{' '}
            <span className="text-muted-foreground">
              alterou {FIELD_LABELS[e.field] ?? e.field}
            </span>
            <span className="ml-1 text-[11px] text-muted-foreground">{formatDateTime(e.changedAt)}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Apenas as últimas {TASK_HISTORY_MAX} alterações são mantidas.
      </p>
    </div>
  );
}
