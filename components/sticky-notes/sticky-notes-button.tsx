'use client';

import { NotebookPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStickyNotesStore } from '@/lib/stores/sticky-notes-store';
import { cn } from '@/lib/utils';

export default function StickyNotesButton() {
  const { notes, addNote } = useStickyNotesStore();
  const count = notes.length;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9"
      title="Notas adesivas"
      onClick={addNote}
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
  );
}
