import { create } from 'zustand';
import { TOUR_TOTAL, type TourContext } from '@/lib/tour/steps';

/**
 * Estado do tutorial. Mora fora da árvore React de propósito: o tour atravessa
 * rotas (Agenda → Workspaces → Kanban) e os layouts remontam no caminho. Um store
 * de módulo sobrevive a essas remontagens; um `useState` no provider, não.
 */
interface TourStore {
  isActive: boolean;
  index: number;
  /** Ids acumulados conforme o usuário circula — nunca apaga o que já sabia. */
  ctx: TourContext;
  /**
   * Id do passo cuja tela já foi aberta. Impede que o provider empurre a mesma rota
   * duas vezes — o que importa quando o destino redireciona no servidor (a página de
   * workspaces manda um workspace_admin de workspace único para o painel dele): sem a
   * trava, tour e servidor ficam se empurrando. Mora no store, e não num `useRef`,
   * porque o provider remonta ao cruzar `(empresa)` ↔ `(workspace)` — exatamente o
   * momento em que a proteção precisa valer.
   */
  navigatedStepId: string | null;
  /**
   * Passos cuja criação já rodou nesta sessão do tour — o cartão troca o botão pela
   * confirmação. É só sobre o que a UI mostra: quem garante que rodar duas vezes não
   * duplica nada são as funções de `lib/tour/build.ts`, que procuram pelo nome antes
   * de criar.
   */
  builtStepIds: string[];
  start: () => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
  mergeContext: (partial: TourContext) => void;
  markNavigated: (stepId: string) => void;
  markBuilt: (stepId: string) => void;
}

export const useTourStore = create<TourStore>((set) => ({
  isActive: false,
  index: 0,
  ctx: {},
  navigatedStepId: null,
  builtStepIds: [],
  start() {
    set({ isActive: true, index: 0, navigatedStepId: null, builtStepIds: [] });
  },
  next() {
    set((s) => {
      const proximo = s.index + 1;
      return proximo >= TOUR_TOTAL
        ? { isActive: false, index: 0, navigatedStepId: null }
        : { index: proximo, navigatedStepId: null };
    });
  },
  prev() {
    set((s) => ({ index: Math.max(0, s.index - 1), navigatedStepId: null }));
  },
  stop() {
    set({ isActive: false, index: 0, navigatedStepId: null });
  },
  markNavigated(stepId) {
    set({ navigatedStepId: stepId });
  },
  markBuilt(stepId) {
    set((s) =>
      s.builtStepIds.includes(stepId)
        ? s
        : { builtStepIds: [...s.builtStepIds, stepId] },
    );
  },
  mergeContext(partial) {
    set((s) => {
      // Só grava chave com valor: um layout que não conhece projectId não pode
      // apagar o projectId que outro já descobriu.
      const definidos = Object.fromEntries(
        Object.entries(partial).filter(([, v]) => Boolean(v)),
      ) as TourContext;
      const mesclado = { ...s.ctx, ...definidos };
      const mudou = (Object.keys(mesclado) as Array<keyof TourContext>).some(
        (k) => mesclado[k] !== s.ctx[k],
      );
      return mudou ? { ctx: mesclado } : s;
    });
  },
}));
