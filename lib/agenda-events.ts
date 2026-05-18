/**
 * Event bus simples para a Agenda — usado por diálogos de criação/edição
 * de eventos para notificar o componente Agenda de que precisa refazer
 * o fetch do range atual.
 *
 * Evita prop-drilling do callback por toda a árvore (Agenda → AgendaWeek →
 * DayTasksPopover → EditEventDialog, etc.) sem precisar de Context.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

export function notifyAgendaChanged(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // ignore — um listener com erro não deve impedir os outros
    }
  }
}

export function subscribeAgendaChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
