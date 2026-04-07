import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StickyNoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'gray';

export interface LinkedTask {
  id: string;
  title: string;
  taskNumber: number;
  projectId: string;
  workspaceId: string;
}

export interface StickyNote {
  id: string;
  content: string;
  color: StickyNoteColor;
  x: number;
  y: number;
  visible: boolean;
  minimized?: boolean;
  zIndex: number;
  createdAt: string;
  linkedTasks?: LinkedTask[];
}

export const NOTE_COLORS: Record<StickyNoteColor, { bg: string; border: string; header: string }> = {
  yellow: { bg: '#fef9c3', border: '#fde047', header: '#fef08a' },
  blue:   { bg: '#dbeafe', border: '#93c5fd', header: '#bfdbfe' },
  green:  { bg: '#dcfce7', border: '#86efac', header: '#bbf7d0' },
  pink:   { bg: '#fce7f3', border: '#f9a8d4', header: '#fbcfe8' },
  purple: { bg: '#ede9fe', border: '#c4b5fd', header: '#ddd6fe' },
  gray:   { bg: '#f3f4f6', border: '#d1d5db', header: '#e5e7eb' },
};

interface StickyNotesStore {
  notes: StickyNote[];
  nextZIndex: number;
  addNote: () => void;
  updateContent: (id: string, content: string) => void;
  updateColor: (id: string, color: StickyNoteColor) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  toggleVisible: (id: string) => void;
  toggleMinimized: (id: string) => void;
  deleteNote: (id: string) => void;
  bringToFront: (id: string) => void;
  addLinkedTask: (noteId: string, task: LinkedTask) => void;
  removeLinkedTask: (noteId: string, taskId: string) => void;
}

export const useStickyNotesStore = create<StickyNotesStore>()(
  persist(
    (set, get) => ({
      notes: [],
      nextZIndex: 1000,

      addNote() {
        const { notes, nextZIndex } = get();
        const newZIndex = nextZIndex + 1;

        let x = 8;
        let y = 72;

        if (typeof window !== 'undefined') {
          const baseX = window.innerWidth - 260;
          const baseY = 72;

          if (notes.length === 0) {
            x = Math.max(8, Math.min(baseX, window.innerWidth - 252));
            y = baseY;
          } else {
            const last = [...notes].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )[0];
            x = Math.max(8, Math.min(last.x + 28, window.innerWidth - 252));
            y = Math.max(72, Math.min(last.y + 28, window.innerHeight - 200));
          }
        }

        const note: StickyNote = {
          id: crypto.randomUUID(),
          content: '',
          color: 'yellow',
          x,
          y,
          visible: true,
          minimized: false,
          zIndex: newZIndex,
          createdAt: new Date().toISOString(),
          linkedTasks: [],
        };

        set({ notes: [...notes, note], nextZIndex: newZIndex });
      },

      updateContent(id, content) {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, content } : n)),
        }));
      },

      updateColor(id, color) {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, color } : n)),
        }));
      },

      updatePosition(id, x, y) {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, x, y } : n)),
        }));
      },

      toggleVisible(id) {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, visible: !n.visible } : n)),
        }));
      },

      toggleMinimized(id) {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, minimized: !n.minimized } : n)),
        }));
      },

      deleteNote(id) {
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
      },

      bringToFront(id) {
        const newZIndex = get().nextZIndex + 1;
        set((state) => ({
          nextZIndex: newZIndex,
          notes: state.notes.map((n) => (n.id === id ? { ...n, zIndex: newZIndex } : n)),
        }));
      },

      addLinkedTask(noteId, task) {
        set((state) => ({
          notes: state.notes.map((n) => {
            if (n.id !== noteId) return n;
            const existing = n.linkedTasks ?? [];
            if (existing.some((t) => t.id === task.id)) return n;
            return { ...n, linkedTasks: [...existing, task] };
          }),
        }));
      },

      removeLinkedTask(noteId, taskId) {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === noteId
              ? { ...n, linkedTasks: (n.linkedTasks ?? []).filter((t) => t.id !== taskId) }
              : n,
          ),
        }));
      },
    }),
    {
      name: 'sticky-notes',
    },
  ),
);
