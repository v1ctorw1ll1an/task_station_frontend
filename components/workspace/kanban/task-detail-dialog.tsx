'use client';

import { useEffect, useTransition, useState, useRef, useCallback } from 'react';
import { TaskAttachmentsSection, IMAGE_MAX_MB, IMAGE_MAX_COUNT } from './task-attachments-section';
import {
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Loader2,
  MessageSquare,
  Pause,
  Pencil,
  Play,
  Scissors,
  Square,
  Timer,
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
import { TransferTaskDialog } from './transfer-task-dialog';
import type { WorkspaceMember, ProjectLabel } from './kanban-board';
import { useActionState } from 'react';
import { MarkdownEditor, MarkdownDisplay } from './markdown-editor';
import type { TaskAttachment } from '@/actions/projeto/get-attachments.action';
import { UserAvatar } from '@/components/ui/user-avatar';
import { DatePicker } from '@/components/ui/date-picker';
import { useTaskTrackingStore } from '@/lib/stores/task-tracking-store';
import { usePrivacyStore } from '@/lib/stores/privacy-store';
import {
  getChecklistsAction,
  type ChecklistItem,
} from '@/actions/projeto/get-checklists.action';
import { createChecklistItemAction } from '@/actions/projeto/create-checklist-item.action';
import { updateChecklistItemAction } from '@/actions/projeto/update-checklist-item.action';
import { deleteChecklistItemAction } from '@/actions/projeto/delete-checklist-item.action';
import { reorderChecklistAction } from '@/actions/projeto/reorder-checklist.action';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { startSessionAction } from '@/actions/task-session/start-session.action';
import { pauseSessionAction } from '@/actions/task-session/pause-session.action';
import { resumeSessionAction } from '@/actions/task-session/resume-session.action';
import { stopSessionAction } from '@/actions/task-session/stop-session.action';
import { rawToActiveSession } from '@/lib/stores/task-tracking-store';
import { TaskLinkedNotes } from '@/components/sticky-notes/task-linked-notes';

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

function formatTrackingSeconds(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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
  taskPrefix: string;
  projectId: string;
  workspaceId: string;
  isAdmin: boolean;
  membros: WorkspaceMember[];
  labels: ProjectLabel[];
  currentUserId: string;
  onClose: () => void;
}

function SortableChecklistItem({
  item,
  editingId,
  editingTitle,
  onToggle,
  onDelete,
  onStartEdit,
  onCommitEdit,
  onEditingTitleChange,
  onCancelEdit,
}: {
  item: ChecklistItem;
  editingId: string | null;
  editingTitle: string;
  onToggle: (item: ChecklistItem) => void;
  onDelete: (id: string) => void;
  onStartEdit: (item: ChecklistItem) => void;
  onCommitEdit: (item: ChecklistItem) => void;
  onEditingTitleChange: (v: string) => void;
  onCancelEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-2 rounded px-1 py-1 hover:bg-muted/40 transition-colors ${isDragging ? 'opacity-50 bg-muted/40' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
        tabIndex={-1}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onToggle(item)}
        className={`shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
          item.completed
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-muted-foreground/40 hover:border-primary'
        }`}
      >
        {item.completed && <Check className="h-2.5 w-2.5" />}
      </button>

      {editingId === item.id ? (
        <input
          autoFocus
          type="text"
          value={editingTitle}
          onChange={(e) => onEditingTitleChange(e.target.value)}
          onBlur={() => onCommitEdit(item)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommitEdit(item);
            if (e.key === 'Escape') onCancelEdit();
          }}
          className="flex-1 text-sm bg-transparent border-b border-input focus:outline-none focus:border-primary"
        />
      ) : (
        <span
          onDoubleClick={() => onStartEdit(item)}
          className={`flex-1 text-sm cursor-default select-none ${
            item.completed ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {item.title}
        </span>
      )}

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function TaskChecklistSection({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId: string;
}) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    getChecklistsAction(projectId, taskId).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [projectId, taskId]);

  const total = items.length;
  const completedCount = items.filter((i) => i.completed).length;
  const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  function handleToggle(item: ChecklistItem) {
    const next = !item.completed;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: next } : i)));
    void updateChecklistItemAction(projectId, taskId, item.id, { completed: next });
  }

  function handleDelete(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    void deleteChecklistItemAction(projectId, taskId, itemId);
  }

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    setIsAdding(true);
    const result = await createChecklistItemAction(projectId, taskId, title);
    if (result.item) {
      setItems((prev) => [...prev, result.item!]);
      setNewTitle('');
    }
    setIsAdding(false);
    addInputRef.current?.focus();
  }

  function startEdit(item: ChecklistItem) {
    setEditingId(item.id);
    setEditingTitle(item.title);
  }

  async function commitEdit(item: ChecklistItem) {
    const title = editingTitle.trim();
    setEditingId(null);
    if (!title || title === item.title) return;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, title } : i)));
    void updateChecklistItemAction(projectId, taskId, item.id, { title });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    void reorderChecklistAction(
      projectId,
      taskId,
      next.map((item, idx) => ({ id: item.id, order: idx + 1 })),
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          Checklist
          {total > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              {completedCount}/{total}
            </span>
          )}
        </span>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-7 text-right shrink-0">{pct}%</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-0.5">
              {items.map((item) => (
                <SortableChecklistItem
                  key={item.id}
                  item={item}
                  editingId={editingId}
                  editingTitle={editingTitle}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onStartEdit={startEdit}
                  onCommitEdit={commitEdit}
                  onEditingTitleChange={setEditingTitle}
                  onCancelEdit={() => setEditingId(null)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add item input */}
      <div className="flex items-center gap-2 mt-1">
        <input
          ref={addInputRef}
          type="text"
          placeholder="Adicionar item..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleAdd();
          }}
          className="flex-1 rounded-md border bg-background px-2.5 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={!newTitle.trim() || isAdding}
          className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Adicionar'}
        </button>
      </div>
    </div>
  );
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
        className="flex w-full items-center justify-between text-sm font-medium hover:text-foreground/80 transition-colors cursor-pointer"
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
                  <span className="mt-0.5">
                    <UserAvatar name={entry.user.name} email={entry.user.email} photoUrl={entry.user.photoUrl} size="xs" />
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
  const [newCommentValue, setNewCommentValue] = useState('');

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [commentState, commentAction, isCommentPending] = useActionState(
    createTaskCommentAction,
    initialCommentState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  const loadComments = (silent = false) => {
    if (!silent) setLoading(true);
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
      setNewCommentValue('');
      setMentionQuery(null);
      loadComments(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentState]);

  async function handleEditSave(commentId: string) {
    if (!editContent.trim()) return;
    setEditError(null);
    const result = await updateTaskCommentAction(projectId, taskId, commentId, editContent);
    if (result.error) {
      setEditError(result.error);
    } else {
      setEditingId(null);
      loadComments(true);
    }
  }

  async function handleDelete(commentId: string) {
    setDeleteError(null);
    const result = await deleteTaskCommentAction(projectId, taskId, commentId);
    if (result.error) {
      setDeleteError(result.error);
    } else {
      loadComments(true);
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
    const cursor = textarea?.selectionStart ?? mentionStart;
    const before = newCommentValue.slice(0, mentionStart);
    const after = newCommentValue.slice(cursor);
    const next = `${before}@${name} ${after}`;
    setNewCommentValue(next);

    const newCursor = mentionStart + name.length + 2;
    setTimeout(() => {
      textarea?.focus();
      textarea?.setSelectionRange(newCursor, newCursor);
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
        className="flex w-full items-center justify-between text-sm font-medium hover:text-foreground/80 transition-colors cursor-pointer"
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
                  <span className="mt-0.5">
                    <UserAvatar name={c.user.name} email={c.user.email} photoUrl={c.user.photoUrl} size="sm" />
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
                        <MarkdownEditor
                          value={editContent}
                          onChange={setEditContent}
                          minRows={2}
                          autoFocus
                        />
                        {editError && <p className="text-xs text-destructive">{editError}</p>}
                        <div className="flex gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            className="h-6 text-xs px-2 cursor-pointer"
                            onClick={() => handleEditSave(c.id)}
                          >
                            Salvar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs px-2 cursor-pointer"
                            onClick={() => setEditingId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-0.5 break-words">
                        <MarkdownDisplay content={c.content} />
                      </div>
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
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Excluir"
                        onClick={() => handleDelete(c.id)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive cursor-pointer"
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
            <input type="hidden" name="content" value={newCommentValue} />
            <div className="relative">
              <MarkdownEditor
                value={newCommentValue}
                onChange={setNewCommentValue}
                onChangeEvent={handleTextareaInput}
                textareaRef={textareaRef}
                placeholder="Escreva um comentário... Use @ para mencionar membros"
                minRows={2}
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
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
                    >
                      <UserAvatar name={m.name} email={m.email} photoUrl={m.photoUrl} size="sm" />
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
            <Button type="submit" size="sm" disabled={isCommentPending} className="h-7 text-xs cursor-pointer">
              {isCommentPending ? 'Enviando...' : 'Comentar'}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function isTextInput(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  return (
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'INPUT' ||
    el.isContentEditable
  );
}

export function TaskDetailDialog({
  task,
  taskPrefix,
  projectId,
  workspaceId,
  isAdmin,
  membros,
  labels,
  currentUserId,
  onClose,
}: TaskDetailDialogProps) {
  const isPrivacyMode = usePrivacyStore((s) => s.isPrivacyMode);
  const [savePending, startSave] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Bridge: attachment image count for paste-limit check in MarkdownEditor
  const [attachmentImageCount, setAttachmentImageCount] = useState(0);
  const [pendingAttachment, setPendingAttachment] = useState<TaskAttachment | null>(null);

  // Direct paste/drop to attachments
  const [isDragOver, setIsDragOver] = useState(false);
  const [dialogUploadError, setDialogUploadError] = useState<string | null>(null);
  const [dialogUploading, setDialogUploading] = useState(false);

  // Transfer dialog
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferMode, setTransferMode] = useState<'copy' | 'cut'>('copy');

  // Task session
  const trackingStore = useTaskTrackingStore();
  const activeSession = task
    ? trackingStore.sessions.find((s) => s.taskId === task.id && s.userId === currentUserId)
    : null;
  const [sessionPending, startSessionTransition] = useTransition();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [, forceTimerTick] = useState(0);

  useEffect(() => {
    if (activeSession?.status !== 'running') return;
    const id = setInterval(() => forceTimerTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [activeSession?.status]);

  // Rastreia o updatedAt do servidor para optimistic locking
  const lastKnownUpdatedAtRef = useRef<string>(task?.updatedAt ?? '');

  const isDateFocusedRef = useRef(false);

  // Snapshot dos campos no momento do último sync com o servidor.
  // hasUnsavedChanges compara o estado local contra este snapshot, não contra task.xxx,
  // pois task.xxx pode mudar via socket enquanto o usuário não editou nada.
  const lastSyncedFieldsRef = useRef({
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'medium',
  });

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

  // Reset fields when task changes (navegação entre tasks)
  useEffect(() => {
     
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
    setSessionError(null);

    lastKnownUpdatedAtRef.current = task?.updatedAt ?? '';
    lastSyncedFieldsRef.current = {
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 'medium',
    };
    saveSeqRef.current = 0;
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Detecta update externo via socket: se task.updatedAt avançou enquanto o dialog está aberto
  useEffect(() => {
    if (!task?.updatedAt || !lastKnownUpdatedAtRef.current) return;

    const serverTs = new Date(task.updatedAt).getTime();
    const knownTs = new Date(lastKnownUpdatedAtRef.current).getTime();

    if (serverTs <= knownTs) return;
    if (saveStatus === 'saving') return;

    // Sempre avança o ref — evita 409 por saves concorrentes de outros usuários
    lastKnownUpdatedAtRef.current = task.updatedAt;

    // Compara contra lastSyncedFieldsRef (valores no último sync), NÃO contra task.xxx.
    // task.xxx já mudou via socket — comparar contra ele causaria falso conflito.
    const hasUnsavedChanges =
      title !== lastSyncedFieldsRef.current.title ||
      description !== lastSyncedFieldsRef.current.description ||
      priority !== lastSyncedFieldsRef.current.priority;

    if (!hasUnsavedChanges) {
      // Sem edições em curso: sincroniza silenciosamente os campos
       
      setTitle(task.title ?? '');
      setDescription(task.description ?? '');
      setPriority(task.priority ?? 'medium');
      setStartDate(task.startDate ? task.startDate.split('T')[0] : '');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setSelectedAssigneeIds(task.taskAssignees.map((ta) => ta.user.id));
      setSelectedLabelIds(task.taskLabels.map((tl) => tl.label.id));
       
      lastSyncedFieldsRef.current = {
        title: task.title ?? '',
        description: task.description ?? '',
        priority: task.priority ?? 'medium',
      };
    }
    // Se hasUnsavedChanges: lastKnownUpdatedAtRef já avançado, campos mantidos
  }, [task?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

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

      startSave(async () => {
        const result = await updateTaskAction({}, formData);

        // Descarta resposta se um save mais recente já foi iniciado
        if (seq !== saveSeqRef.current) return;

        if (result.success) {
          lastSyncedFieldsRef.current = {
            title: fields.title,
            description: fields.description,
            priority: fields.priority as 'low' | 'medium' | 'high' | 'urgent',
          };
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
          setSaveError(result.error ?? 'Erro ao salvar');
        }
      });
    },
    [task, projectId, workspaceId, startSave],  
  );


  function handleDelete() {
    if (!task) return;
    startDelete(async () => {
      const result = await deleteTaskAction(projectId, task.id, workspaceId);
      if (!result.error) {
        onClose();
        // Sem router.refresh() — o evento task:deleted via socket atualiza o store
      }
    });
  }

  async function uploadDirectAttachment(file: File) {
    if (!file.type.startsWith('image/')) return;
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
      setDialogUploadError(`Imagem excede o limite de ${IMAGE_MAX_MB} MB.`);
      return;
    }
    if (attachmentImageCount >= IMAGE_MAX_COUNT) {
      setDialogUploadError(`Limite de ${IMAGE_MAX_COUNT} imagens atingido.`);
      return;
    }
    setDialogUploadError(null);
    setDialogUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file, `paste-${Date.now()}.png`);
      const res = await fetch(
        `/api/files/projetos/${projectId}/tasks/${task!.id}/attachments`,
        { method: 'POST', body: fd },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        setDialogUploadError(data.message ?? 'Erro ao enviar imagem.');
        return;
      }
      const att = (await res.json()) as TaskAttachment;
      setPendingAttachment(att);
    } finally {
      setDialogUploading(false);
    }
  }

  function toggleAssignee(id: string) {
    const next = selectedAssigneeIds.includes(id)
      ? selectedAssigneeIds.filter((x) => x !== id)
      : [...selectedAssigneeIds, id];
    setSelectedAssigneeIds(next);
  }

  function toggleLabel(id: string) {
    const next = selectedLabelIds.includes(id)
      ? selectedLabelIds.filter((x) => x !== id)
      : [...selectedLabelIds, id];
    setSelectedLabelIds(next);
  }

  if (!task) return null;

  const filteredMembros = membros
    .filter(
      (m) =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(memberSearch.toLowerCase()),
    )
    .sort((a, b) => {
      if (!memberSearch) return 0;
      const q = memberSearch.toLowerCase();
      const aStarts = a.name.toLowerCase().startsWith(q);
      const bStarts = b.name.toLowerCase().startsWith(q);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const selectedMembers = membros.filter((m) => selectedAssigneeIds.includes(m.id));

  return (
    <Dialog
      open={!!task}
      onOpenChange={(open) => {
        if (!open) {
          doSave({
            title,
            description,
            priority,
            startDate,
            dueDate,
            assigneeIds: selectedAssigneeIds,
            labelIds: selectedLabelIds,
          });
          onClose();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-3xl max-h-[95vh] flex flex-col p-0 gap-0"
        onPointerDownOutside={(e) => {
          if (isDateFocusedRef.current) e.preventDefault();
        }}
        onPaste={(e) => {
          if (isTextInput(e.target)) return;
          const imgItem = Array.from(e.clipboardData.items).find(
            (item) => item.kind === 'file' && item.type.startsWith('image/'),
          );
          if (!imgItem) return;
          e.preventDefault();
          const file = imgItem.getAsFile();
          if (file) uploadDirectAttachment(file);
        }}
        onDragOver={(e) => {
          const hasImage = Array.from(e.dataTransfer.items).some(
            (item) => item.kind === 'file' && item.type.startsWith('image/'),
          );
          if (!hasImage) return;
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = Array.from(e.dataTransfer.files).find((f) =>
            f.type.startsWith('image/'),
          );
          if (file) uploadDirectAttachment(file);
        }}
      >
        {isDragOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/5 pointer-events-none">
            <p className="text-sm font-medium text-primary">Soltar para anexar imagem</p>
          </div>
        )}

        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex-row items-center justify-between">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            {task?.taskNumber != null && (
              <span className="font-mono text-sm text-muted-foreground font-normal">
                {taskPrefix}-{task.taskNumber}
              </span>
            )}
            Detalhes da task
          </DialogTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {saveStatus === 'saving' || savePending ? (
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

        {(dialogUploading || dialogUploadError) && (
          <div className={`px-6 py-2 text-xs flex items-center gap-2 border-b ${dialogUploadError ? 'text-destructive bg-destructive/10' : 'text-muted-foreground'}`}>
            {dialogUploading && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
            {dialogUploading ? 'Enviando imagem para anexos...' : dialogUploadError}
            {dialogUploadError && (
              <button type="button" onClick={() => setDialogUploadError(null)} className="ml-auto cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Body — two columns */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
          {/* Left: title + description + comments + history */}
          <div className="flex flex-col flex-1 md:overflow-y-auto px-4 md:px-6 py-4 gap-4 min-w-0">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da task"
              className={`w-full text-lg font-semibold bg-transparent border-0 border-b border-transparent focus:border-input focus:outline-none focus:ring-0 pb-1 placeholder:text-muted-foreground/50 transition-colors${isPrivacyMode ? ' blur-sm select-none' : ''}`}
            />

            {/* Description */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descrição</p>
              <MarkdownEditor
                value={description}
                onChange={(val) => setDescription(val)}
                placeholder="Adicione uma descrição..."
                projectId={projectId}
                taskId={task.id}
                imageCount={attachmentImageCount}
                onPasteAttachmentAdded={setPendingAttachment}
                collapsible
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
                onImageCountChange={setAttachmentImageCount}
                pendingAttachment={pendingAttachment}
                onPendingAttachmentConsumed={() => setPendingAttachment(null)}
              />
            </div>

            {/* Checklist */}
            <div className="border-t pt-4">
              <TaskChecklistSection projectId={projectId} taskId={task.id} />
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

            {/* Linked sticky notes */}
            <div className="border-t pt-4 pb-2">
              <TaskLinkedNotes
                taskId={task.id}
                taskNumber={task.taskNumber}
                taskTitle={task.title}
                projectId={projectId}
                workspaceId={workspaceId}
              />
            </div>
          </div>

          {/* Right: metadata sidebar */}
          <div className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l md:overflow-y-auto overflow-x-hidden px-4 py-4 space-y-5">
            {/* Priority */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prioridade</p>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as 'low' | 'medium' | 'high' | 'urgent')}
              >
                <SelectTrigger className="h-8 text-sm cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                      Baixa
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0" />
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
                  className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                >
                  {selectedMembers.length > 0 ? (
                    <span className="flex items-center gap-1 min-w-0">
                      <span className="flex -space-x-1 shrink-0">
                        {selectedMembers.slice(0, 3).map((m) => (
                          <span key={m.id} className="ring-1 ring-background rounded-full">
                            <UserAvatar name={m.name} email={m.email} photoUrl={m.photoUrl} size="xs" />
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
                            setSelectedAssigneeIds([]);
                            setMemberSearch('');
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-muted-foreground cursor-pointer"
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
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
                          >
                            <UserAvatar name={member.name} email={member.email} photoUrl={member.photoUrl} size="sm" />
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
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium transition-opacity cursor-pointer ${isSelected ? 'opacity-100 ring-2' : 'opacity-40'}`}
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
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Sem data de início"
                side="top"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prazo</p>
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="Sem prazo"
                side="top"
              />
            </div>

            {/* Time tracking */}
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Timer className="h-3 w-3" />
                Tempo
              </p>
              {activeSession ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border px-3 py-1.5 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          activeSession.status === 'running'
                            ? 'bg-green-500 animate-pulse'
                            : 'bg-yellow-500'
                        }`}
                      />
                      <span className="font-mono text-sm font-semibold tabular-nums">
                        {formatTrackingSeconds(trackingStore.getDisplaySeconds(activeSession.id))}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {activeSession.status === 'running' ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 cursor-pointer"
                          disabled={sessionPending}
                          title="Pausar"
                          onClick={() => {
                            const displaySecs = trackingStore.getDisplaySeconds(activeSession.id);
                            trackingStore.applySessionPaused(activeSession.id, displaySecs);
                            startSessionTransition(async () => {
                              const r = await pauseSessionAction(activeSession.id);
                              if (r.data) trackingStore.applySessionPaused(activeSession.id, r.data.totalSeconds);
                              else if (r.error) trackingStore.applySessionResumed(activeSession.id, activeSession.resumedAt ?? new Date().toISOString());
                            });
                          }}
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 cursor-pointer"
                          disabled={sessionPending}
                          title="Retomar"
                          onClick={() => {
                            const now = new Date().toISOString();
                            trackingStore.applySessionResumed(activeSession.id, now);
                            startSessionTransition(async () => {
                              const r = await resumeSessionAction(activeSession.id);
                              if (r.data) trackingStore.applySessionResumed(activeSession.id, r.data.resumedAt ?? now);
                              else if (r.error) trackingStore.applySessionPaused(activeSession.id, activeSession.totalSeconds);
                            });
                          }}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive cursor-pointer"
                        disabled={sessionPending}
                        title="Encerrar"
                        onClick={() => {
                          trackingStore.applySessionStopped(activeSession.id);
                          startSessionTransition(async () => {
                            const r = await stopSessionAction(activeSession.id);
                            if (r.error) trackingStore.applySessionStarted(activeSession);
                          });
                        }}
                      >
                        <Square className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full cursor-pointer"
                    disabled={sessionPending}
                    onClick={() => {
                      if (!task) return;
                      setSessionError(null);
                      startSessionTransition(async () => {
                        const r = await startSessionAction(task.id);
                        if (r.data) trackingStore.applySessionStarted(rawToActiveSession(r.data));
                        else if (r.error) setSessionError(r.error);
                      });
                    }}
                  >
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    Iniciar
                  </Button>
                  {sessionError && (
                    <p className="text-xs text-destructive leading-snug">{sessionError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Transfer */}
            <div className="pt-2 border-t space-y-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start truncate cursor-pointer"
                onClick={() => {
                  setTransferMode('copy');
                  setTransferOpen(true);
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                Copiar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start truncate cursor-pointer"
                onClick={() => {
                  setTransferMode('cut');
                  setTransferOpen(true);
                }}
              >
                <Scissors className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                Mover
              </Button>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletePending}
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                      Excluir
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
                      <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

          </div>
        </div>
      </DialogContent>
      <TransferTaskDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        task={task}
        projectId={projectId}
        defaultMode={transferMode}
      />
    </Dialog>
  );
}
