'use client';

import dynamic from 'next/dynamic';
import type { StickyNote } from '@/lib/stores/sticky-notes-store';

export const StickyNotesManagerClient = dynamic<{ initialNotes: StickyNote[] }>(
  () => import('./sticky-notes-manager'),
  { ssr: false },
);

export const StickyNotesButtonClient = dynamic(
  () => import('./sticky-notes-button'),
  { ssr: false },
);
