'use client';

import { useCallback, useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  updatePublicTaskAction,
  type UpdatePublicTaskFields,
} from '@/actions/projeto/update-public-task.action';
import type { PublicTask } from '@/actions/projeto/get-public-task.action';

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

function toDateInput(iso: string | null): string {
  if (!iso) return '';
  return iso.split('T')[0] ?? '';
}

function initialOf(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  return (first[0] ?? '?').toUpperCase();
}

export function PublicTaskView({ token, initialTask }: PublicTaskViewProps) {
  const [task, setTask] = useState<PublicTask>(initialTask);
  const [title, setTitle] = useState(initialTask.title);
  const [description, setDescription] = useState(initialTask.description ?? '');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const persist = useCallback(
    (fields: UpdatePublicTaskFields) => {
      setError(null);
      startTransition(async () => {
        const res = await updatePublicTaskAction(token, fields);
        if (res.error || !res.task) {
          setError(res.error ?? 'Erro ao salvar');
          return;
        }
        setTask(res.task);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
      });
    },
    [token],
  );

  const saveTitle = () => {
    const trimmed = title.trim();
    if (trimmed.length > 0 && trimmed !== task.title) persist({ title: trimmed });
    else setTitle(task.title);
  };

  const saveDescription = () => {
    const current = task.description ?? '';
    if (description !== current) persist({ description: description || null });
  };

  const youGuest = task.guests.find((g) => g.isYou);

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
            onBlur={saveTitle}
            disabled={pending}
            maxLength={255}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="public-desc" className="text-xs uppercase tracking-wide text-muted-foreground">
            Descrição
          </Label>
          <textarea
            id="public-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={saveDescription}
            disabled={pending}
            rows={6}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Sem descrição"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Prioridade</Label>
            <Select
              value={task.priority}
              onValueChange={(value: Priority) => persist({ priority: value })}
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
            <DatePicker
              value={toDateInput(task.startDate)}
              onChange={(v) => persist({ startDate: v || null })}
              disabled={pending}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Vencimento</Label>
            <DatePicker
              value={toDateInput(task.dueDate)}
              onChange={(v) => persist({ dueDate: v || null })}
              disabled={pending}
            />
          </div>
        </div>
      </div>

      {task.labels.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Labels</p>
          <div className="flex flex-wrap gap-1">
            {task.labels.map((label, idx) => (
              <span
                key={`${label.name}-${idx}`}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: `${label.color}20`, color: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {task.assignees.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Responsáveis
          </p>
          <div className="flex flex-wrap gap-2">
            {task.assignees.map((a, idx) => (
              <div
                key={`${a.name}-${idx}`}
                className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-1"
              >
                {a.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.photoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                    {initialOf(a.name)}
                  </span>
                )}
                <span className="text-xs">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {task.checklists.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Checklist</p>
          <ul className="space-y-1 rounded-md border bg-card p-3">
            {task.checklists.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded border ${
                    item.completed ? 'bg-primary text-primary-foreground' : 'bg-background'
                  }`}
                >
                  {item.completed && <Check className="h-3 w-3" />}
                </span>
                <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                  {item.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                  {initialOf(g.name)}
                </span>
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
