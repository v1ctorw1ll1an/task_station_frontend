'use client';

import dynamic from 'next/dynamic';

export const StickyNotesManagerClient = dynamic(
  () => import('./sticky-notes-manager'),
  { ssr: false },
);

export const StickyNotesButtonClient = dynamic(
  () => import('./sticky-notes-button'),
  { ssr: false },
);
