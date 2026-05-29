'use client';

import { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlignLeft, CalendarDays, Copy, MessageSquare, Scissors, Tag, User, UserRound } from 'lucide-react';
import { gravatarUrl } from '@/lib/gravatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { TransferTaskDialog } from './transfer-task-dialog';
import { useKanbanStore } from '@/lib/stores/kanban-store';
import { useTaskTrackingStore } from '@/lib/stores/task-tracking-store';
import { usePrivacyStore } from '@/lib/stores/privacy-store';

export interface KanbanTaskLabel {
  label: { id: string; name: string; color: string };
}

export interface KanbanTask {
  id: string;
  taskNumber: number | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  order: number;
  dueDate: string | null;
  startDate: string | null;
  updatedAt: string;
  columnId: string;
  projectId: string;
  taskAssignees: { user: { id: string; name: string; email: string; photoUrl: string | null } }[];
  reporter: { id: string; name: string; email: string; photoUrl: string | null };
  taskLabels: KanbanTaskLabel[];
  _count: { taskComments: number; taskGuests: number };
}

const PRIORITY_LABELS: Record<KanbanTask['priority'], string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

// Gestalt: gray → blue → orange → red (none → info → warning → critical)
const PRIORITY_CLASSES: Record<KanbanTask['priority'], string> = {
  low: 'text-slate-500 bg-slate-100 border border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700',
  medium: 'text-blue-600 bg-blue-50 border border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
  high: 'text-amber-600 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800',
  urgent: 'text-red-600 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function todayLocalStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false;
  return dueDate.split('T')[0] < todayLocalStr();
}

function AssigneeAvatar({ user }: { user: { name: string; email: string; photoUrl: string | null } }) {
  const [gravatarSrc, setGravatarSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (user.photoUrl) return;
    let cancelled = false;
    gravatarUrl(user.email, 40).then((url) => {
      if (!cancelled) setGravatarSrc(url);
    });
    return () => { cancelled = true; };
  }, [user.email, user.photoUrl]);

  const rawPhoto = user.photoUrl
    ? user.photoUrl.startsWith('http')
      ? user.photoUrl
      : `${process.env.NEXT_PUBLIC_API_URL}${user.photoUrl}`
    : null;
  const src = rawPhoto ?? gravatarSrc;

  if (failed || !src) {
    return <>{getInitials(user.name)}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={user.name}
      className="w-full h-full object-cover rounded-full"
      onError={() => setFailed(true)}
    />
  );
}

interface KanbanCardProps {
  task: KanbanTask;
  taskPrefix: string;
  onClick: (task: KanbanTask) => void;
  isDragOverlay?: boolean;
  columnIsDone?: boolean;
}

export function KanbanCard({ task, taskPrefix, onClick, isDragOverlay = false, columnIsDone = false }: KanbanCardProps) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferMode, setTransferMode] = useState<'copy' | 'cut'>('copy');

  const currentUserId = useKanbanStore((s) => s.currentUserId);
  const isRunning = useTaskTrackingStore((s) =>
    s.sessions.some((sess) => sess.taskId === task.id && sess.userId === currentUserId && sess.status === 'running'),
  );
  const isPrivacyMode = usePrivacyStore((s) => s.isPrivacyMode);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = !columnIsDone && isOverdue(task.dueDate);
  const assignees = task.taskAssignees.map((ta) => ta.user);

  const cardContent = (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={[
        'bg-background rounded-md border p-3 cursor-pointer hover:border-primary/50 transition-colors space-y-2',
        isDragging && !isDragOverlay ? 'opacity-40' : '',
        isDragOverlay ? 'shadow-lg rotate-1' : '',
        isRunning ? 'ring-2 ring-primary/60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {task.taskNumber != null && (
        <span className="text-[10px] font-mono text-muted-foreground">
          {taskPrefix}-{task.taskNumber}
        </span>
      )}
      <p className={`text-sm font-medium leading-snug ${columnIsDone ? 'line-through text-muted-foreground' : ''} ${isPrivacyMode ? 'blur-sm select-none' : ''}`}>{task.title}</p>

      {task.taskLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.taskLabels.map(({ label }) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: label.color + '22', color: label.color, border: `1px solid ${label.color}55` }}
            >
              <Tag className="h-2.5 w-2.5 shrink-0" />
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASSES[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.description && (
            <AlignLeft className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
          {task._count.taskComments > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              {task._count.taskComments}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {task.dueDate && (
            <span className={`flex items-center gap-0.5 ${columnIsDone ? 'line-through text-green-600 dark:text-green-500' : overdue ? 'text-destructive' : ''}`}>
              <CalendarDays className="h-3 w-3" />
              {(() => {
                const [, m, d] = task.dueDate.split('T')[0].split('-');
                return `${d}/${m}`;
              })()}
            </span>
          )}
          {task._count.taskGuests > 0 && (
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted ring-2 ring-green-500"
              title={`${task._count.taskGuests} convidado${task._count.taskGuests > 1 ? 's' : ''}`}
            >
              <UserRound className="h-3 w-3 text-muted-foreground" />
            </span>
          )}
          {assignees.length > 0 ? (
            <div className="flex -space-x-1">
              {assignees.slice(0, 3).map((user) => (
                <span
                  key={user.id}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-1 ring-background overflow-hidden"
                  title={user.name}
                >
                  <AssigneeAvatar user={user} />
                </span>
              ))}
              {assignees.length > 3 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-1 ring-background text-muted-foreground">
                  +{assignees.length - 3}
                </span>
              )}
            </div>
          ) : (
            <User className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </div>
      </div>
    </div>
  );

  if (isDragOverlay) return cardContent;

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{cardContent}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setTransferMode('copy');
              setTransferOpen(true);
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar para outro projeto
          </ContextMenuItem>
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setTransferMode('cut');
              setTransferOpen(true);
            }}
          >
            <Scissors className="mr-2 h-4 w-4" />
            Mover para outro projeto
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <TransferTaskDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        task={task}
        projectId={task.projectId}
        defaultMode={transferMode}
      />
    </>
  );
}
