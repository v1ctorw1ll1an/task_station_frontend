'use client';

import { useStickyNotesStore } from '@/lib/stores/sticky-notes-store';
import { StickyNote } from './sticky-note';

export default function StickyNotesManager() {
  const notes = useStickyNotesStore((s) => s.notes);
  const visibleNotes = notes.filter((n) => n.visible);

  return (
    <>
      {visibleNotes.map((note) => (
        <StickyNote key={note.id} note={note} />
      ))}
    </>
  );
}
