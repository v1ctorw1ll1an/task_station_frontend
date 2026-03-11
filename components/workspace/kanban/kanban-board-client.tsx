'use client';

import dynamic from 'next/dynamic';

const KanbanBoard = dynamic(
  () => import('./kanban-board').then((m) => m.KanbanBoard),
  { ssr: false },
);

export { KanbanBoard };
