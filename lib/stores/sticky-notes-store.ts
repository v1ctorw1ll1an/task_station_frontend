import { create } from 'zustand';
import { createStickyNoteAction } from '@/actions/sticky-notes/create-sticky-note.action';
import { updateStickyNoteAction } from '@/actions/sticky-notes/update-sticky-note.action';
import { deleteStickyNoteAction } from '@/actions/sticky-notes/delete-sticky-note.action';
import { linkTaskToNoteAction } from '@/actions/sticky-notes/link-task.action';
import { unlinkTaskFromNoteAction } from '@/actions/sticky-notes/unlink-task.action';

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

// Debounce timer map (lives outside store to avoid serialization issues)
const positionTimers = new Map<string, ReturnType<typeof setTimeout>>();

interface StickyNotesStore {
  notes: StickyNote[];
  nextZIndex: number;
  isLoaded: boolean;

  hydrate: (notes: StickyNote[]) => void;
  addServerNote: (note: StickyNote) => void;
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

export const useStickyNotesStore = create<StickyNotesStore>()((set, get) => ({
  notes: [],
  nextZIndex: 1000,
  isLoaded: false,

  hydrate(notes) {
    const maxZ = notes.reduce((m, n) => Math.max(m, n.zIndex), 1000);
    set({ notes, nextZIndex: maxZ, isLoaded: true });
  },

  addServerNote(note) {
    set((s) => ({ notes: [...s.notes, note] }));
  },

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

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimisticNote: StickyNote = {
      id: tempId,
      content: '',
      color: 'yellow',
      x,
      y,
      visible: true,
      minimized: false,
      zIndex: newZIndex,
      createdAt: now,
      linkedTasks: [],
    };

    set({ notes: [...notes, optimisticNote], nextZIndex: newZIndex });

    createStickyNoteAction({ content: '', color: 'yellow', x, y, visible: true, minimized: false, zIndex: newZIndex })
      .then((result) => {
        if (result.success) {
          // Replace temp id with real server id
          set((s) => ({
            notes: s.notes.map((n) =>
              n.id === tempId ? { ...result.note, linkedTasks: [] } : n,
            ),
          }));
        } else {
          // Rollback
          set((s) => ({ notes: s.notes.filter((n) => n.id !== tempId) }));
        }
      });
  },

  updateContent(id, content) {
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, content } : n)),
    }));
    // API call fires here; the component already debounces before calling this
    updateStickyNoteAction(id, { content });
  },

  updateColor(id, color) {
    const previous = get().notes.find((n) => n.id === id);
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, color } : n)),
    }));
    updateStickyNoteAction(id, { color }).then((r) => {
      if (!r.success && previous) {
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, color: previous.color } : n)),
        }));
      }
    });
  },

  updatePosition(id, x, y) {
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }));
    // Debounce in case drag implementation ever fires on mousemove
    if (positionTimers.has(id)) clearTimeout(positionTimers.get(id)!);
    positionTimers.set(id, setTimeout(() => {
      positionTimers.delete(id);
      updateStickyNoteAction(id, { x, y });
    }, 300));
  },

  toggleVisible(id) {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const visible = !note.visible;
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, visible } : n)),
    }));
    updateStickyNoteAction(id, { visible }).then((r) => {
      if (!r.success) {
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, visible: !visible } : n)),
        }));
      }
    });
  },

  toggleMinimized(id) {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const minimized = !note.minimized;
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, minimized } : n)),
    }));
    updateStickyNoteAction(id, { minimized }).then((r) => {
      if (!r.success) {
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, minimized: !minimized } : n)),
        }));
      }
    });
  },

  deleteNote(id) {
    const previous = get().notes.find((n) => n.id === id);
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
    deleteStickyNoteAction(id).then((r) => {
      if (!r.success && previous) {
        set((s) => ({ notes: [...s.notes, previous] }));
      }
    });
  },

  bringToFront(id) {
    const newZIndex = get().nextZIndex + 1;
    set((s) => ({
      nextZIndex: newZIndex,
      notes: s.notes.map((n) => (n.id === id ? { ...n, zIndex: newZIndex } : n)),
    }));
    updateStickyNoteAction(id, { zIndex: newZIndex });
  },

  addLinkedTask(noteId, task) {
    set((s) => ({
      notes: s.notes.map((n) => {
        if (n.id !== noteId) return n;
        const existing = n.linkedTasks ?? [];
        if (existing.some((t) => t.id === task.id)) return n;
        return { ...n, linkedTasks: [...existing, task] };
      }),
    }));
    linkTaskToNoteAction(noteId, task.id).then((r) => {
      if (!r.success) {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === noteId
              ? { ...n, linkedTasks: (n.linkedTasks ?? []).filter((t) => t.id !== task.id) }
              : n,
          ),
        }));
      }
    });
  },

  removeLinkedTask(noteId, taskId) {
    const previousNote = get().notes.find((n) => n.id === noteId);
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === noteId
          ? { ...n, linkedTasks: (n.linkedTasks ?? []).filter((t) => t.id !== taskId) }
          : n,
      ),
    }));
    unlinkTaskFromNoteAction(noteId, taskId).then((r) => {
      if (!r.success && previousNote) {
        set((s) => ({
          notes: s.notes.map((n) => (n.id === noteId ? previousNote : n)),
        }));
      }
    });
  },
}));
