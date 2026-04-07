'use client';

import { useState } from 'react';
import { NotebookPen, Plus, X, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useStickyNotesStore, NOTE_COLORS } from '@/lib/stores/sticky-notes-store';

interface TaskLinkedNotesProps {
  taskId: string;
  taskNumber: number | null;
  taskTitle: string;
  projectId: string;
  workspaceId: string;
}

export function TaskLinkedNotes({
  taskId,
  taskNumber,
  taskTitle,
  projectId,
  workspaceId,
}: TaskLinkedNotesProps) {
  const { notes, addLinkedTask, removeLinkedTask, toggleVisible, bringToFront } =
    useStickyNotesStore();
  const [open, setOpen] = useState(false);

  const linkedNotes = notes.filter((n) => n.linkedTasks?.some((t) => t.id === taskId));
  const unlinkedNotes = notes.filter((n) => !n.linkedTasks?.some((t) => t.id === taskId));

  function handleLink(noteId: string) {
    addLinkedTask(noteId, {
      id: taskId,
      title: taskTitle,
      taskNumber: taskNumber ?? 0,
      projectId,
      workspaceId,
    });
    setOpen(false);
  }

  function handleShow(noteId: string, visible: boolean) {
    if (!visible) toggleVisible(noteId);
    bringToFront(noteId);
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <NotebookPen className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Notas vinculadas
          </p>
          {linkedNotes.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              ({linkedNotes.length})
            </span>
          )}
        </div>

        {/* "Vincular nota" — popover opens upward (side="top") */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs px-2">
              <Plus className="h-3 w-3" />
              Vincular nota
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 p-0"
            side="top"
            align="end"
            sideOffset={6}
            avoidCollisions
          >
            <div className="px-3 py-2 border-b">
              <p className="text-sm font-medium">Vincular nota à tarefa</p>
              {taskNumber != null && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  #{taskNumber} {taskTitle}
                </p>
              )}
            </div>
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-5 text-center">
                Nenhuma nota criada ainda.
              </p>
            ) : unlinkedNotes.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-5 text-center">
                Todas as notas já estão vinculadas.
              </p>
            ) : (
              <ul className="max-h-56 overflow-y-auto divide-y divide-border">
                {unlinkedNotes.map((note) => {
                  const colors = NOTE_COLORS[note.color];
                  return (
                    <li key={note.id}>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 text-left transition-colors"
                        onClick={() => handleLink(note.id)}
                      >
                        <span
                          className="shrink-0 h-3.5 w-3.5 rounded-full border"
                          style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                        />
                        <span className="flex-1 text-xs text-muted-foreground truncate min-w-0">
                          {note.content.trim() || '(vazia)'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Linked notes — compact chips that wrap */}
      {linkedNotes.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 max-h-[92px] overflow-y-auto">
          {linkedNotes.map((note) => {
            const colors = NOTE_COLORS[note.color];
            return (
              <div
                key={note.id}
                className="group flex items-center gap-1 rounded-full pl-1.5 pr-1 py-0.5 max-w-[180px] shrink-0"
                style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
                title={note.content.trim() || '(vazia)'}
              >
                {/* Color dot */}
                <span
                  className="shrink-0 h-2 w-2 rounded-full"
                  style={{ backgroundColor: colors.border }}
                />

                {/* Truncated preview */}
                <span
                  className="text-[11px] truncate leading-tight"
                  style={{ color: '#374151', maxWidth: 100 }}
                >
                  {note.content.trim() || '(vazia)'}
                </span>

                {/* Eye — show on screen */}
                <button
                  type="button"
                  title={note.visible ? 'Trazer para frente' : 'Mostrar nota'}
                  className="shrink-0 h-4 w-4 flex items-center justify-center rounded-full opacity-60 hover:opacity-100 hover:bg-black/10 transition-all"
                  onClick={() => handleShow(note.id, note.visible)}
                >
                  <Eye className="h-2.5 w-2.5 text-gray-600" />
                </button>

                {/* Unlink */}
                <button
                  type="button"
                  title="Desvincular nota"
                  className="shrink-0 h-4 w-4 flex items-center justify-center rounded-full opacity-60 hover:opacity-100 hover:bg-red-200/60 transition-all group/x"
                  onClick={() => removeLinkedTask(note.id, taskId)}
                >
                  <X className="h-2.5 w-2.5 text-gray-500 group-hover/x:text-red-600 transition-colors" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Nenhuma nota vinculada.</p>
      )}
    </div>
  );
}
