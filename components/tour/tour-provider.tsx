'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTourStore } from '@/lib/stores/tour-store';
import { TOUR_STEPS } from '@/lib/tour/steps';
import { getProfileAction } from '@/actions/perfil/get-profile.action';
import { completeTutorialAction } from '@/actions/me/complete-tutorial.action';
import { getWorkspaceProjectsForSidebar } from '@/actions/workspace/get-projetos-sidebar.action';
import { fetchWorkspacesAction } from '@/actions/empresa/fetch-workspaces.action';
import { TourSpotlight } from './tour-spotlight';

interface TourProviderProps {
  companyId?: string;
  /**
   * O workspace em que o usuário está de fato — só o layout `(workspace)` sabe disso e
   * só ele deve passar. O layout `(empresa)` não chuta o primeiro da lista: depois que
   * o tour cria o workspace Marketing, o `router.refresh()` que mostra a criação na
   * tela reenviaria esse chute e sobrescreveria o id recém-nascido, e o passo seguinte
   * criaria o projeto no workspace errado. Faltando o id, o provider descobre um.
   */
  workspaceId?: string;
}

/**
 * Só uma vez por carregamento da aba: os layouts `(empresa)` e `(workspace)` montam
 * este provider, e navegar entre eles remonta o componente. Sem essa trava, cada
 * troca de tela dispararia outra consulta de perfil — e reabriria o tour de quem
 * acabou de pular.
 */
let jaVerificouPerfil = false;

export function TourProvider({ companyId, workspaceId }: TourProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isActive,
    index,
    ctx,
    navigatedStepId,
    builtStepIds,
    start,
    next,
    prev,
    stop,
    mergeContext,
    markNavigated,
    markBuilt,
  } = useTourStore();
  const resolvendoIds = useRef(false);
  const [criando, setCriando] = useState(false);
  const [erroCriacao, setErroCriacao] = useState<string | null>(null);

  // Contexto vindo do layout que está montado agora.
  useEffect(() => {
    mergeContext({ companyId, workspaceId });
  }, [companyId, workspaceId, mergeContext]);

  // Abre sozinho para quem nunca viu.
  useEffect(() => {
    if (jaVerificouPerfil) return;
    jaVerificouPerfil = true;

    let cancelado = false;
    void getProfileAction().then(({ data }) => {
      if (!cancelado && data && data.tutorialSeenAt === null) start();
    });
    return () => {
      cancelado = true;
    };
  }, [start]);

  const step = isActive ? TOUR_STEPS[index] : undefined;

  /**
   * Descobre os ids que faltam para o passo atual ter tela.
   *
   * O contexto inicial vem dos layouts renderizados no servidor, que não sabem nada de
   * quem acabou de criar a conta: sem workspace, `route` resolve `null` para quase todo
   * o tour e a tela nunca acompanha os passos. Como o efeito depende de `step`, a busca
   * se repete a cada avanço — então o workspace e o projeto que o usuário cria durante o
   * tutorial são encontrados no passo seguinte, que é justamente o roteiro proposto.
   */
  useEffect(() => {
    // Do contexto, não das props: ele acumula o que qualquer layout já descobriu.
    const empresa = ctx.companyId;
    if (!step || !empresa || resolvendoIds.current) return;
    if (step.route(ctx)) return; // já tem destino: nada a descobrir

    resolvendoIds.current = true;
    void (async () => {
      try {
        let workspace = ctx.workspaceId;
        if (!workspace) {
          const { data } = await fetchWorkspacesAction(empresa, 1);
          workspace = data[0]?.id;
          if (workspace) mergeContext({ workspaceId: workspace });
        }
        if (workspace && !ctx.projectId) {
          const projetos = await getWorkspaceProjectsForSidebar(workspace);
          const ativo = projetos.find((p) => p.isActive) ?? projetos[0];
          if (ativo) mergeContext({ projectId: ativo.id });
        }
      } finally {
        resolvendoIds.current = false;
      }
    })();
  }, [step, ctx, mergeContext]);

  // Leva o usuário até a tela do passo — uma vez por passo, para não brigar com um
  // redirect do servidor nem arrastar de volta quem navegou por conta própria.
  useEffect(() => {
    if (!step || navigatedStepId === step.id) return;
    const destino = step.route(ctx);
    if (!destino) return;
    markNavigated(step.id);
    if (destino !== pathname) router.push(destino);
  }, [step, ctx, pathname, router, navigatedStepId, markNavigated]);

  if (!step) return null;

  const encerrar = () => {
    stop();
    void completeTutorialAction();
  };

  const avancar = () => {
    setErroCriacao(null);
    if (index === TOUR_STEPS.length - 1) encerrar();
    else next();
  };

  const voltar = () => {
    setErroCriacao(null);
    prev();
  };

  /**
   * Cria o exemplo do passo. Não avança sozinho depois: o valor didático está em ver a
   * coisa aparecer na tela que já está aberta — daí o `router.refresh()`, que recarrega
   * a sidebar e a lista renderizadas no servidor.
   */
  const construir = () => {
    if (!step.build || criando) return;
    setCriando(true);
    setErroCriacao(null);
    void step.build
      .run(ctx)
      .then((r) => {
        if (r.error) {
          setErroCriacao(r.error);
          return;
        }
        if (r.ctx) mergeContext(r.ctx);
        markBuilt(step.id);
        router.refresh();
      })
      .catch(() => setErroCriacao('Erro ao conectar com o servidor.'))
      .finally(() => setCriando(false));
  };

  return (
    <TourSpotlight
      // Remonta a cada passo: estado de posição/recorte nasce limpo, sem efeito de reset.
      key={`${step.id}-${index}`}
      step={step}
      index={index}
      building={criando}
      built={builtStepIds.includes(step.id)}
      buildError={erroCriacao}
      onBuild={construir}
      onNext={avancar}
      onPrev={voltar}
      onSkip={encerrar}
    />
  );
}
