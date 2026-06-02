'use client';

import { useRef, useCallback, useState } from 'react';
import { X, Palette, Minus, ChevronUp, Trash2 } from 'lucide-react';
import {
  useStickyNotesStore,
  type StickyNote as StickyNoteType,
  type StickyNoteColor,
  NOTE_COLORS,
  NOTE_WIDTH,
  clampNotePosition,
} from '@/lib/stores/sticky-notes-store';
import { useViewportSize } from '@/hooks/use-viewport-size';

const COLOR_KEYS = Object.keys(NOTE_COLORS) as StickyNoteColor[];
const MAX_CHARS = 255;

interface StickyNoteProps {
  note: StickyNoteType;
}

export function StickyNote({ note }: StickyNoteProps) {
  const {
    updateContent,
    updateColor,
    updatePosition,
    toggleVisible,
    toggleMinimized,
    deleteNote,
    bringToFront,
  } = useStickyNotesStore();

  const { width: vw, height: vh } = useViewportSize();
  // Display position clamped to the current viewport so a note saved on a large
  // monitor snaps to the nearest edge instead of disappearing on a smaller one.
  // The stored note.x / note.y stay untouched (preserved for larger screens).
  const { x: displayX, y: displayY } = clampNotePosition(note.x, note.y, note.minimized, vw, vh);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [charCount, setCharCount] = useState(note.content.length);

  // Drag state — kept in refs to avoid re-renders during drag
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, noteX: 0, noteY: 0 });

  // Debounced content update
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setCharCount(value.length);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        updateContent(note.id, value);
      }, 300);
    },
    [note.id, updateContent],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('button, [data-radix-popper-content-wrapper]')) return;

      e.preventDefault();
      bringToFront(note.id);
      isDragging.current = true;
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        noteX: displayX,
        noteY: displayY,
      };

      const noteEl = (e.currentTarget as HTMLDivElement).parentElement!;

      function onMouseMove(ev: MouseEvent) {
        if (!isDragging.current) return;
        noteEl.style.left = `${Math.max(0, dragStart.current.noteX + ev.clientX - dragStart.current.mouseX)}px`;
        noteEl.style.top = `${Math.max(0, dragStart.current.noteY + ev.clientY - dragStart.current.mouseY)}px`;
      }

      function onMouseUp(ev: MouseEvent) {
        if (!isDragging.current) return;
        isDragging.current = false;
        updatePosition(
          note.id,
          Math.max(0, dragStart.current.noteX + ev.clientX - dragStart.current.mouseX),
          Math.max(0, dragStart.current.noteY + ev.clientY - dragStart.current.mouseY),
        );
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [note.id, displayX, displayY, bringToFront, updatePosition],
  );

  const colors = NOTE_COLORS[note.color];
  const nearLimit = charCount >= MAX_CHARS - 20;

  return (
    <div
      className="fixed select-none shadow-lg rounded-xl overflow-hidden flex flex-col"
      style={{
        left: displayX,
        top: displayY,
        zIndex: note.zIndex,
        width: NOTE_WIDTH,
        minHeight: note.minimized ? 'auto' : 200,
        backgroundColor: colors.bg,
        border: `1.5px solid ${colors.border}`,
      }}
    >
      {/* Header / Drag handle */}
      <div
        className="flex items-center gap-0.5 px-2 py-2 cursor-grab active:cursor-grabbing shrink-0"
        style={{ backgroundColor: colors.header }}
        onMouseDown={handleMouseDown}
      >
        {/* Color picker */}
        <div className="relative">
          <button
            type="button"
            title="Cor da nota"
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-black/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker((v) => !v);
            }}
          >
            <Palette className="h-4 w-4 text-gray-600" />
          </button>

          {showColorPicker && (
            <div
              className="absolute top-8 left-0 z-10 flex gap-1.5 p-2 rounded-lg shadow-lg border bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {COLOR_KEYS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 active:scale-95"
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

        {/* Drag spacer */}
        <div className="flex-1" />

        {/* Minimize */}
        <button
          type="button"
          title={note.minimized ? 'Expandir' : 'Minimizar'}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-black/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            toggleMinimized(note.id);
          }}
        >
          {note.minimized ? (
            <ChevronUp className="h-4 w-4 text-gray-600" />
          ) : (
            <Minus className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {/* Delete */}
        <button
          type="button"
          title="Excluir nota"
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-500/20 transition-colors group"
          onClick={(e) => {
            e.stopPropagation();
            deleteNote(note.id);
          }}
        >
          <Trash2 className="h-4 w-4 text-gray-500 group-hover:text-red-600 transition-colors" />
        </button>

        {/* Close (hide) */}
        <button
          type="button"
          title="Fechar (ocultar)"
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-black/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            toggleVisible(note.id);
          }}
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Content area — hidden when minimized */}
      {!note.minimized && (
        <>
          <textarea
            className="flex-1 w-full resize-none px-3 py-2 text-sm leading-relaxed outline-none bg-transparent placeholder:text-gray-400"
            style={{ color: '#1f2937', minHeight: 140 }}
            placeholder="Escreva uma nota..."
            defaultValue={note.content}
            maxLength={MAX_CHARS}
            onChange={handleContentChange}
            onMouseDown={(e) => {
              e.stopPropagation();
              bringToFront(note.id);
            }}
          />

          {/* Character counter */}
          <div
            className="px-3 pb-2 flex justify-end shrink-0"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span
              className="text-[10px] tabular-nums"
              style={{
                color: nearLimit
                  ? charCount >= MAX_CHARS
                    ? '#dc2626'
                    : '#d97706'
                  : '#9ca3af',
              }}
            >
              {charCount}/{MAX_CHARS}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
