'use client';

import { useEffect, useTransition, useState, useRef, useCallback } from 'react';
import { TaskAttachmentsSection } from './task-attachments-section';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  MessageSquare,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateTaskAction } from '@/actions/projeto/update-task.action';
import { deleteTaskAction } from '@/actions/projeto/delete-task.action';
import {
  getTaskHistoryAction,
  type TaskHistoryEntry,
} from '@/actions/projeto/get-task-history.action';
import {
  getTaskCommentsAction,
  type TaskComment,
} from '@/actions/projeto/get-task-comments.action';
import { createTaskCommentAction, type CreateCommentActionState } from '@/actions/projeto/create-task-comment.action';
import { updateTaskCommentAction } from '@/actions/projeto/update-task-comment.action';
import { deleteTaskCommentAction } from '@/actions/projeto/delete-task-comment.action';
import type { KanbanTask } from './kanban-card';
import type { WorkspaceMember, ProjectLabel } from './kanban-board';
import { useActionState } from 'react';

const FIELD_LABELS: Record<string, string> = {
  title: 'Título',
  description: 'Descrição',
  priority: 'Prioridade',
  startDate: 'Data início',
  dueDate: 'Prazo',
  assignees: 'Responsáveis',
  labels: 'Labels',
  column: 'Coluna',
  attachment_added: 'anexo',
  attachment_removed: 'anexo',
};

const ATTACHMENT_FIELDS = new Set(['attachment_added', 'attachment_removed']);

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

function formatHistoryValue(field: string, value: string | null): string {
  if (value === null || value === '') return '(vazio)';
  if (field === 'priority') return PRIORITY_LABELS[value] ?? value;
  if (field === 'startDate' || field === 'dueDate') {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
  return value;
}

function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TaskDetailDialogProps {
  task: KanbanTask | null;
  projectId: string;
  workspaceId: string;
  isAdmin: boolean;
  membros: WorkspaceMember[];
  labels: ProjectLabel[];
  currentUserId: string;
  onClose: () => void;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/** Renders comment text with clickable URLs and highlighted @mentions */
function renderCommentContent(content: string, membros: WorkspaceMember[]) {
  const memberNames = [...membros.map((m) => m.name)].sort((a, b) => b.length - a.length);
  const result: React.ReactNode[] = [];
  let i = 0;
  let textBuffer = '';
  let keyIdx = 0;

  while (i < content.length) {
    if (content.startsWith('http://', i) || content.startsWith('https://', i)) {
      if (textBuffer) {
        result.push(<span key={keyIdx++}>{textBuffer}</span>);
        textBuffer = '';
      }
      const rest = content.slice(i);
      const spaceIdx = rest.search(/[\s]/);
      const url = spaceIdx === -1 ? rest : rest.slice(0, spaceIdx);
      result.push(
        <a
          key={keyIdx++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline hover:text-blue-600 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {url}
        </a>,
      );
      i += url.length;
      continue;
    }

    if (content[i] === '@') {
      let matched = false;
      for (const name of memberNames) {
        if (content.startsWith(name, i + 1)) {
          const after = content[i + 1 + name.length];
          if (after === undefined || /[\s,.!?;:\n]/.test(after)) {
            if (textBuffer) {
              result.push(<span key={keyIdx++}>{textBuffer}</span>);
              textBuffer = '';
            }
            result.push(
              <span
                key={keyIdx++}
                className="text-primary font-semibold bg-primary/10 rounded px-0.5"
              >
                @{name}
              </span>,
            );
            i += 1 + name.length;
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        textBuffer += content[i++];
      }
      continue;
    }

    textBuffer += content[i++];
  }

  if (textBuffer) result.push(<span key={keyIdx++}>{textBuffer}</span>);
  return result;
}

function TaskHistorySection({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId: string;
}) {
  const [history, setHistory] = useState<TaskHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getTaskHistoryAction(projectId, taskId).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [projectId, taskId]);

  const sorted = [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
  );

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-medium hover:text-foreground/80 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Histórico de alterações
          {!loading && history.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">({history.length})</span>
          )}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <>
          {loading ? (
            <p className="text-xs text-muted-foreground">Carregando...</p>
          ) : sorted.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma alteração registrada.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {sorted.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-medium mt-0.5">
                    {getInitials(entry.user.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{entry.user.name}</span>
                    {ATTACHMENT_FIELDS.has(entry.field) ? (
                      <>
                        {entry.field === 'attachment_added' ? ' adicionou ' : ' removeu '}
                        <span className="font-medium">
                          {formatHistoryValue(entry.field, entry.field === 'attachment_added' ? entry.newValue : entry.oldValue)}
                        </span>
                      </>
                    ) : (
                      <>
                        {' alterou '}
                        <span className="font-medium">
                          {FIELD_LABELS[entry.field] ?? entry.field}
                        </span>
                        {': '}
                        {entry.oldValue !== null ? (
                          <>
                            <span className="line-through text-muted-foreground">
                              {formatHistoryValue(entry.field, entry.oldValue)}
                            </span>
                            {' → '}
                            <span>{formatHistoryValue(entry.field, entry.newValue)}</span>
                          </>
                        ) : (
                          <span>{formatHistoryValue(entry.field, entry.newValue)}</span>
                        )}
                      </>
                    )}
                    <div className="text-muted-foreground mt-0.5">{formatHistoryDate(entry.changedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const initialCommentState: CreateCommentActionState = {};

function TaskCommentsSection({
  projectId,
  taskId,
  currentUserId,
  isAdmin,
  membros,
}: {
  projectId: string;
  taskId: string;
  currentUserId: string;
  isAdmin: boolean;
  membros: WorkspaceMember[];
}) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [commentState, commentAction, isCommentPending] = useActionState(
    createTaskCommentAction,
    initialCommentState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  const loadComments = () => {
    setLoading(true);
    getTaskCommentsAction(projectId, taskId).then((data) => {
      setComments(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, taskId]);

  useEffect(() => {
    if (commentState.success) {
      formRef.current?.reset();
      setMentionQuery(null);
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentState.success]);

  async function handleEditSave(commentId: string) {
    if (!editContent.trim()) return;
    setEditError(null);
    const result = await updateTaskCommentAction(projectId, taskId, commentId, editContent);
    if (result.error) {
      setEditError(result.error);
    } else {
      setEditingId(null);
      loadComments();
    }
  }

  async function handleDelete(commentId: string) {
    setDeleteError(null);
    const result = await deleteTaskCommentAction(projectId, taskId, commentId);
    if (result.error) {
      setDeleteError(result.error);
    } else {
      loadComments();
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    const cursor = e.target.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursor);
    const atIdx = textBeforeCursor.lastIndexOf('@');

    if (atIdx !== -1) {
      const fragment = textBeforeCursor.slice(atIdx + 1);
      if (!fragment.includes(' ') || fragment.length === 0) {
        setMentionStart(atIdx);
        setMentionQuery(fragment);
        return;
      }
    }

    setMentionQuery(null);
    setMentionStart(-1);
  }

  function insertMention(name: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const value = textarea.value;
    const before = value.slice(0, mentionStart);
    const after = value.slice(textarea.selectionStart ?? mentionStart);
    const newValue = `${before}@${name} ${after}`;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value',
    )?.set;
    nativeInputValueSetter?.call(textarea, newValue);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    const newCursor = mentionStart + name.length + 2;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);

    setMentionQuery(null);
    setMentionStart(-1);
  }

  const filteredMentionMembers =
    mentionQuery !== null
      ? membros.filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
      : [];

  const sorted = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-medium hover:text-foreground/80 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4" />
          Comentários
          {!loading && comments.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">({comments.length})</span>
          )}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <>
          {loading ? (
            <p className="text-xs text-muted-foreground">Carregando...</p>
          ) : sorted.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
          ) : (
            <div className="space-y-3 pr-1">
              {sorted.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium mt-0.5">
                    {getInitials(c.user.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-medium text-xs">{c.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatHistoryDate(c.createdAt)}
                        {c.updatedAt !== c.createdAt && ' (editado)'}
                      </span>
                    </div>

                    {editingId === c.id ? (
                      <div className="mt-1 space-y-1.5">
                        <textarea
                          autoFocus
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        />
                        {editError && <p className="text-xs text-destructive">{editError}</p>}
                        <div className="flex gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => handleEditSave(c.id)}
                          >
                            Salvar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs px-2"
                            onClick={() => setEditingId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">
                        {renderCommentContent(c.content, membros)}
                      </p>
                    )}
                  </div>

                  {editingId !== c.id && (c.user.id === currentUserId || isAdmin) && (
                    <div className="flex shrink-0 gap-0.5 mt-0.5">
                      {c.user.id === currentUserId && (
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditContent(c.content);
                            setEditError(null);
                          }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Excluir"
                        onClick={() => handleDelete(c.id)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}

          <form ref={formRef} action={commentAction} className="space-y-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="taskId" value={taskId} />
            <div className="relative">
              <textarea
                ref={textareaRef}
                name="content"
                placeholder="Escreva um comentário... Use @ para mencionar membros"
                rows={2}
                onChange={handleTextareaInput}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
              {mentionQuery !== null && filteredMentionMembers.length > 0 && (
                <div className="absolute bottom-full mb-1 left-0 w-full rounded-md border bg-popover shadow-md z-50 max-h-40 overflow-y-auto">
                  {filteredMentionMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertMention(m.name);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium flex-shrink-0">
                        {getInitials(m.name)}
                      </span>
                      <span className="flex flex-col items-start min-w-0">
                        <span className="truncate font-medium">{m.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{m.email}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {commentState.error && <p className="text-xs text-destructive">{commentState.error}</p>}
            <Button type="submit" size="sm" disabled={isCommentPending} className="h-7 text-xs">
              {isCommentPending ? 'Enviando...' : 'Comentar'}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

export function TaskDetailDialog({
  task,
  projectId,
  workspaceId,
  isAdmin,
  membros,
  labels,
  currentUserId,
  onClose,
}: TaskDetailDialogProps) {
  const router = useRouter();
  const [savePending, startSave] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rastreia o updatedAt do servidor para optimistic locking
  const lastKnownUpdatedAtRef = useRef<string>(task?.updatedAt ?? '');

  // Sequência de saves — ignora respostas de saves desatualizados
  const saveSeqRef = useRef(0);

  // Controlled field state
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState(task?.priority ?? 'medium');
  const [startDate, setStartDate] = useState(task?.startDate ? task.startDate.split('T')[0] : '');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.split('T')[0] : '');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(
    task?.taskAssignees.map((ta) => ta.user.id) ?? [],
  );
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    task?.taskLabels.map((tl) => tl.label.id) ?? [],
  );
  const [memberSearch, setMemberSearch] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  // Reset fields when task changes
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setPriority(task?.priority ?? 'medium');
    setStartDate(task?.startDate ? task.startDate.split('T')[0] : '');
    setDueDate(task?.dueDate ? task.dueDate.split('T')[0] : '');
    setSelectedAssigneeIds(task?.taskAssignees.map((ta) => ta.user.id) ?? []);
    setSelectedLabelIds(task?.taskLabels.map((tl) => tl.label.id) ?? []);
    setMemberSearch('');
    setMemberDropdownOpen(false);
    setSaveStatus('idle');
    setSaveError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    lastKnownUpdatedAtRef.current = task?.updatedAt ?? '';
    saveSeqRef.current = 0;
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close member dropdown on outside click
  useEffect(() => {
    if (!memberDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(e.target as Node)) {
        setMemberDropdownOpen(false);
        setMemberSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [memberDropdownOpen]);

  const doSave = useCallback(
    (fields: {
      title: string;
      description: string;
      priority: string;
      startDate: string;
      dueDate: string;
      assigneeIds: string[];
      labelIds: string[];
    }) => {
      if (!task) return;
      setSaveStatus('saving');
      setSaveError(null);

      // Incrementa sequência — respostas com seq menor são descartadas
      const seq = ++saveSeqRef.current;

      const formData = new FormData();
      formData.set('projectId', projectId);
      formData.set('workspaceId', workspaceId);
      formData.set('taskId', task.id);
      formData.set('title', fields.title);
      formData.set('description', fields.description);
      formData.set('priority', fields.priority);
      formData.set('startDate', fields.startDate);
      formData.set('dueDate', fields.dueDate);
      fields.assigneeIds.forEach((id) => formData.append('assigneeIds[]', id));
      fields.labelIds.forEach((id) => formData.append('labelIds[]', id));
      if (lastKnownUpdatedAtRef.current) {
        formData.set('lastKnownUpdatedAt', lastKnownUpdatedAtRef.current);
      }

      startSave(async () => {
        const result = await updateTaskAction({}, formData);

        // Descarta resposta se um save mais recente já foi iniciado
        if (seq !== saveSeqRef.current) return;

        if (result.success) {
          // Atualiza o timestamp conhecido para o próximo save
          if (result.updatedAt) lastKnownUpdatedAtRef.current = result.updatedAt;
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else if (result.conflict) {
          setSaveStatus('conflict');
          setSaveError(result.error ?? 'Conflito de edição');
        } else {
          setSaveStatus('error');
          setSaveError(result.error ?? 'Erro ao salvar');
        }
      });
    },
    [task, projectId, workspaceId, startSave],  
  );

  const scheduleAutoSave = useCallback(
    (overrides?: Partial<Parameters<typeof doSave>[0]>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        doSave({
          title,
          description,
          priority,
          startDate,
          dueDate,
          assigneeIds: selectedAssigneeIds,
          labelIds: selectedLabelIds,
          ...overrides,
        });
      }, 800);
    },
    [title, description, priority, startDate, dueDate, selectedAssigneeIds, selectedLabelIds, doSave],
  );

  function handleDelete() {
    if (!task) return;
    startDelete(async () => {
      const result = await deleteTaskAction(projectId, task.id, workspaceId);
      if (!result.error) {
        onClose();
        router.refresh();
      }
    });
  }

  function toggleAssignee(id: string) {
    const next = selectedAssigneeIds.includes(id)
      ? selectedAssigneeIds.filter((x) => x !== id)
      : [...selectedAssigneeIds, id];
    setSelectedAssigneeIds(next);
    scheduleAutoSave({ assigneeIds: next });
  }

  function toggleLabel(id: string) {
    const next = selectedLabelIds.includes(id)
      ? selectedLabelIds.filter((x) => x !== id)
      : [...selectedLabelIds, id];
    setSelectedLabelIds(next);
    scheduleAutoSave({ labelIds: next });
  }

  if (!task) return null;

  const filteredMembros = membros.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()),
  );

  const selectedMembers = membros.filter((m) => selectedAssigneeIds.includes(m.id));

  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex-row items-center justify-between">
          <DialogTitle className="text-base font-semibold">Detalhes da task</DialogTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {saveStatus === 'conflict' ? (
              <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                <span>⚠ Task editada por outro usuário.</span>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="underline hover:no-underline"
                >
                  Recarregar
                </button>
              </span>
            ) : saveStatus === 'saving' || savePending ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Salvando...
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="h-3 w-3" />
                Salvo
              </span>
            ) : saveStatus === 'error' ? (
              <span className="text-destructive">{saveError}</span>
            ) : null}
          </div>
        </DialogHeader>

        {/* Body — two columns */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: title + description + comments + history */}
          <div className="flex flex-col flex-1 overflow-y-auto px-6 py-4 gap-4 min-w-0">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                scheduleAutoSave({ title: e.target.value });
              }}
              placeholder="Título da task"
              className="w-full text-lg font-semibold bg-transparent border-0 border-b border-transparent focus:border-input focus:outline-none focus:ring-0 pb-1 placeholder:text-muted-foreground/50 transition-colors"
            />

            {/* Description */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descrição</p>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  scheduleAutoSave({ description: e.target.value });
                }}
                placeholder="Adicione uma descrição..."
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Reporter: <span className="font-medium text-foreground">{task.reporter.name}</span>
            </p>

            {/* Attachments */}
            <div className="border-t pt-4">
              <TaskAttachmentsSection
                projectId={projectId}
                taskId={task.id}
                isAdmin={isAdmin}
              />
            </div>

            {/* Comments */}
            <div className="border-t pt-4">
              <TaskCommentsSection
                projectId={projectId}
                taskId={task.id}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                membros={membros}
              />
            </div>

            {/* History */}
            <div className="border-t pt-4">
              <TaskHistorySection projectId={projectId} taskId={task.id} />
            </div>
          </div>

          {/* Right: metadata sidebar */}
          <div className="w-56 shrink-0 border-l overflow-y-auto px-4 py-4 space-y-5">
            {/* Priority */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prioridade</p>
              <Select
                value={priority}
                onValueChange={(val) => {
                  setPriority(val);
                  scheduleAutoSave({ priority: val });
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                      Baixa
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      Média
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                      Alta
                    </span>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                      Urgente
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignees */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Responsáveis</p>
              <div className="relative" ref={memberDropdownRef}>
                <button
                  type="button"
                  onClick={() => setMemberDropdownOpen((v) => !v)}
                  className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {selectedMembers.length > 0 ? (
                    <span className="flex items-center gap-1 min-w-0">
                      <span className="flex -space-x-1 shrink-0">
                        {selectedMembers.slice(0, 3).map((m) => (
                          <span
                            key={m.id}
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-1 ring-background"
                          >
                            {getInitials(m.name)}
                          </span>
                        ))}
                      </span>
                      <span className="truncate text-xs ml-1">
                        {selectedMembers.length === 1
                          ? selectedMembers[0].name
                          : `${selectedMembers.length} selecionados`}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Sem responsável</span>
                  )}
                  <span className="text-muted-foreground text-xs shrink-0 ml-1">▾</span>
                </button>

                {memberDropdownOpen && (
                  <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md">
                    <div className="p-2 border-b">
                      <Input
                        autoFocus
                        placeholder="Buscar..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                      {selectedAssigneeIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next: string[] = [];
                            setSelectedAssigneeIds(next);
                            setMemberSearch('');
                            scheduleAutoSave({ assigneeIds: next });
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                          Remover todos
                        </button>
                      )}
                      {filteredMembros.length === 0 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum membro encontrado</p>
                      )}
                      {filteredMembros.map((member) => {
                        const isSelected = selectedAssigneeIds.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleAssignee(member.id)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium flex-shrink-0">
                              {getInitials(member.name)}
                            </span>
                            <span className="flex flex-col items-start min-w-0">
                              <span className="truncate font-medium text-xs">{member.name}</span>
                              <span className="truncate text-[10px] text-muted-foreground">{member.email}</span>
                            </span>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 ml-auto flex-shrink-0 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Labels */}
            {labels.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Labels</p>
                <div className="flex flex-wrap gap-1">
                  {labels.map((label) => {
                    const isSelected = selectedLabelIds.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => toggleLabel(label.id)}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium transition-opacity ${isSelected ? 'opacity-100 ring-2' : 'opacity-40'}`}
                        style={{
                          backgroundColor: label.color + '22',
                          color: label.color,
                          border: `1px solid ${label.color}55`,
                        }}
                      >
                        {label.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data início</p>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  scheduleAutoSave({ startDate: e.target.value });
                }}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prazo</p>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  scheduleAutoSave({ dueDate: e.target.value });
                }}
                className="h-8 text-sm"
              />
            </div>

            {/* Delete */}
            {isAdmin && (
              <div className="pt-2 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletePending}
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Excluir task
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir task?</AlertDialogTitle>
                      <AlertDialogDescription>
                        A task <strong>{task.title}</strong> será removida permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
