'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface KanbanTask {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  order: number;
  dueDate: string | null;
  startDate: string | null;
  columnId: string;
  projectId: string;
  assignee: { id: string; name: string } | null;
  reporter: { id: string; name: string };
}

const PRIORITY_LABELS: Record<KanbanTask['priority'], string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

const PRIORITY_VARIANTS: Record<
  KanbanTask['priority'],
  'outline' | 'secondary' | 'default' | 'destructive'
> = {
  low: 'outline',
  medium: 'secondary',
  high: 'default',
  urgent: 'destructive',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

interface KanbanCardProps {
  task: KanbanTask;
  onClick: (task: KanbanTask) => void;
  isDragOverlay?: boolean;
}

export function KanbanCard({ task, onClick, isDragOverlay = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdue(task.dueDate);

  return (
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
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-sm font-medium leading-snug">{task.title}</p>

      <div className="flex items-center justify-between gap-2">
        <Badge variant={PRIORITY_VARIANTS[task.priority]} className="text-xs px-1.5 py-0">
          {PRIORITY_LABELS[task.priority]}
        </Badge>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {task.dueDate && (
            <span className={`flex items-center gap-0.5 ${overdue ? 'text-destructive' : ''}`}>
              <CalendarDays className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })}
            </span>
          )}
          {task.assignee && (
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium"
              title={task.assignee.name}
            >
              {getInitials(task.assignee.name)}
            </span>
          )}
          {!task.assignee && (
            <User className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </div>
      </div>
    </div>
  );
}
