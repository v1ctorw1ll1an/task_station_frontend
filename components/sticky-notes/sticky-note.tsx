'use client';

import { useRef, useCallback, useState } from 'react';
import { X, MoreHorizontal, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useStickyNotesStore,
  type StickyNote as StickyNoteType,
  type StickyNoteColor,
  NOTE_COLORS,
} from '@/lib/stores/sticky-notes-store';

const COLOR_KEYS = Object.keys(NOTE_COLORS) as StickyNoteColor[];

interface StickyNoteProps {
  note: StickyNoteType;
}

export function StickyNote({ note }: StickyNoteProps) {
  const { updateContent, updateColor, updatePosition, toggleVisible, deleteNote, bringToFront } =
    useStickyNotesStore();

  const [showColorPicker, setShowColorPicker] = useState(false);

  // Drag state — kept in refs to avoid re-renders during drag
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, noteX: 0, noteY: 0 });

  // Debounced content update
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        updateContent(note.id, value);
      }, 300);
    },
    [note.id, updateContent],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't drag if clicking buttons inside header
      if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) return;

      e.preventDefault();
      bringToFront(note.id);
      isDragging.current = true;
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        noteX: note.x,
        noteY: note.y,
      };

      const noteEl = (e.currentTarget as HTMLDivElement).parentElement!;

      function onMouseMove(ev: MouseEvent) {
        if (!isDragging.current) return;
        const dx = ev.clientX - dragStart.current.mouseX;
        const dy = ev.clientY - dragStart.current.mouseY;
        const newX = Math.max(0, dragStart.current.noteX + dx);
        const newY = Math.max(0, dragStart.current.noteY + dy);
        noteEl.style.left = `${newX}px`;
        noteEl.style.top = `${newY}px`;
      }

      function onMouseUp(ev: MouseEvent) {
        if (!isDragging.current) return;
        isDragging.current = false;
        const dx = ev.clientX - dragStart.current.mouseX;
        const dy = ev.clientY - dragStart.current.mouseY;
        const newX = Math.max(0, dragStart.current.noteX + dx);
        const newY = Math.max(0, dragStart.current.noteY + dy);
        updatePosition(note.id, newX, newY);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [note.id, note.x, note.y, bringToFront, updatePosition],
  );

  const colors = NOTE_COLORS[note.color];

  return (
    <div
      className="fixed select-none shadow-md rounded-lg overflow-hidden flex flex-col"
      style={{
        left: note.x,
        top: note.y,
        zIndex: note.zIndex,
        width: 220,
        minHeight: 180,
        backgroundColor: colors.bg,
        border: `1.5px solid ${colors.border}`,
      }}
      onMouseDown={() => bringToFront(note.id)}
    >
      {/* Header / Drag handle */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 cursor-grab active:cursor-grabbing shrink-0"
        style={{ backgroundColor: colors.header }}
        onMouseDown={handleMouseDown}
      >
        {/* Color picker toggle */}
        <div className="relative">
          <button
            type="button"
            title="Cor da nota"
            className="p-0.5 rounded hover:bg-black/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker((v) => !v);
            }}
          >
            <Palette className="h-3.5 w-3.5 text-gray-600" />
          </button>

          {showColorPicker && (
            <div
              className="absolute top-6 left-0 z-10 flex gap-1 p-1.5 rounded-md shadow-lg border bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {COLOR_KEYS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: NOTE_COLORS[c].bg,
                    borderColor: note.color === c ? NOTE_COLORS[c].border : 'transparent',
                    outline: note.color === c ? `2px solid ${NOTE_COLORS[c].border}` : 'none',
                  }}
                  onClick={() => {
                    updateColor(note.id, c);
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Spacer — takes up drag area */}
        <div className="flex-1" />

        {/* 3-dot menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-0.5 rounded hover:bg-black/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-gray-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => deleteNote(note.id)}
            >
              Excluir nota
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Close (hide) button */}
        <button
          type="button"
          title="Fechar"
          className="p-0.5 rounded hover:bg-black/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            toggleVisible(note.id);
          }}
        >
          <X className="h-3.5 w-3.5 text-gray-600" />
        </button>
      </div>

      {/* Content textarea */}
      <textarea
        className="flex-1 w-full resize-none p-2 text-sm leading-relaxed outline-none bg-transparent placeholder:text-gray-400"
        style={{ color: '#1f2937', minHeight: 140 }}
        placeholder="Escreva uma nota..."
        defaultValue={note.content}
        onChange={handleContentChange}
        onMouseDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}
