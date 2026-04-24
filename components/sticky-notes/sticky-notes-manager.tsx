'use client';

import { useEffect } from 'react';
import { useStickyNotesStore, type StickyNote } from '@/lib/stores/sticky-notes-store';
import { createStickyNoteAction } from '@/actions/sticky-notes/create-sticky-note.action';
import { StickyNote as StickyNoteComponent } from './sticky-note';

interface Props {
  initialNotes: StickyNote[];
}

export default function StickyNotesManager({ initialNotes }: Props) {
  const { hydrate, notes, addServerNote } = useStickyNotesStore();

  useEffect(() => {
    hydrate(initialNotes);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // One-time migration from localStorage (runs after hydration)
  useEffect(() => {
    const LS_KEY = 'sticky-notes';
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const localNotes: StickyNote[] = JSON.parse(raw)?.state?.notes ?? [];
      if (!localNotes.length) {
        localStorage.removeItem(LS_KEY);
        return;
      }
      Promise.allSettled(
        localNotes.map((n) =>
          createStickyNoteAction({
            content: n.content,
            color: n.color,
            x: n.x,
            y: n.y,
            visible: n.visible,
            minimized: n.minimized ?? false,
            zIndex: n.zIndex,
          }).then((result) => {
            if (result.success) addServerNote(result.note);
          }),
        ),
      ).then(() => localStorage.removeItem(LS_KEY));
    } catch {
      localStorage.removeItem(LS_KEY);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleNotes = notes.filter((n) => n.visible);

  return (
    <>
      {visibleNotes.map((note) => (
        <StickyNoteComponent key={note.id} note={note} />
      ))}
    </>
  );
}
