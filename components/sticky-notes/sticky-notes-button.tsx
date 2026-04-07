'use client';

import { useState } from 'react';
import { NotebookPen, Plus, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useStickyNotesStore, NOTE_COLORS } from '@/lib/stores/sticky-notes-store';
import { cn } from '@/lib/utils';

export default function StickyNotesButton() {
  const { notes, addNote, toggleVisible, deleteNote } = useStickyNotesStore();
  const [open, setOpen] = useState(false);

  const count = notes.length;
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  function handleNewNote() {
    addNote();
    setOpen(false);
  }

  function handleItemClick(id: string, visible: boolean) {
    if (!visible) {
      toggleVisible(id);
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          title="Notas adesivas"
        >
          <NotebookPen className="h-4 w-4" />
          {count > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                'h-4 min-w-4 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold px-1',
              )}
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        {/* Panel header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b">
          <span className="text-sm font-medium">Notas adesivas</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={handleNewNote}
          >
            <Plus className="h-3.5 w-3.5" />
            Nova nota
          </Button>
        </div>

        {/* Notes list */}
        <div className="max-h-72 overflow-y-auto">
          {sortedNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">
              Nenhuma nota ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {sortedNotes.map((note) => {
                const colors = NOTE_COLORS[note.color];
                return (
                  <li
                    key={note.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 transition-colors',
                      !note.visible && 'cursor-pointer hover:bg-muted/50',
                    )}
                    onClick={() => handleItemClick(note.id, note.visible)}
                  >
                    {/* Color swatch */}
                    <span
                      className="shrink-0 h-3.5 w-3.5 rounded-full border"
                      style={{
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                      }}
                    />

                    {/* Content preview */}
                    <span className="flex-1 text-xs text-muted-foreground truncate min-w-0 select-none">
                      {note.content.trim() || '(vazia)'}
                    </span>

                    {/* Actions — separated with enough gap to avoid accidental clicks */}
                    <div className="shrink-0 flex items-center gap-0.5 ml-1">
                      {/* Show/hide toggle */}
                      <button
                        type="button"
                        title={note.visible ? 'Ocultar nota' : 'Mostrar nota'}
                        className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisible(note.id);
                          if (!note.visible) setOpen(false);
                        }}
                      >
                        {note.visible ? (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>

                      {/* Visual separator */}
                      <span className="w-px h-4 bg-border mx-1 shrink-0" />

                      {/* Delete — separated visually so user doesn't click by accident */}
                      <button
                        type="button"
                        title="Excluir nota"
                        className="h-7 w-7 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors group"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
