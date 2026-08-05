/**
 * Tutorial de primeiros passos — fonte única dos passos.
 *
 * O tutorial não descreve a interface no abstrato e não se limita a mandar clicar: ele
 * **monta o exemplo junto com o usuário**. Uma equipe de **Marketing** preparando a
 * **Campanha de Dia das Mães**, criada de verdade, na ordem em que as coisas nascem no
 * sistema:
 *
 *     workspace → (equipe) → projeto → colunas → task → agenda
 *
 * Isso não é estética: a dúvida que mais trava quem chega ("o que é workspace e o que é
 * projeto?") só se resolve construindo um dentro do outro. A agenda fica por último de
 * propósito — é onde a task datada nos passos anteriores reaparece. Começar pela agenda
 * mostrava um calendário vazio para quem ainda não tinha nada.
 *
 * Três recursos sustentam isso, e cada um cobre uma falha que o tour já teve:
 *
 * - **`build`** — o passo cria o exemplo de verdade (ver `./build`, sempre idempotente).
 *   Sem isso o tour parava no primeiro passo de conta nova: sem workspace não há projeto,
 *   sem projeto não há quadro, e o resto só sabia apontar para o vazio.
 * - **`route`, obrigatório em todo passo** — o passo abre a tela que descreve, indo e
 *   voltando. Passo sem rota falava de uma tela sem nunca mostrá-la.
 * - **`anchor`** — destaca um elemento REAL pelo atributo `data-tour`, e o elemento
 *   continua clicável. Sem âncora presente (falta de permissão, ou nada criado ainda) o
 *   cartão centraliza; nunca um destaque apontando para o vazio.
 *
 * O número do passo não aparece no título: o cartão já mostra "3 de 11", e manter os dois
 * em dia era garantia de divergência na primeira vez que alguém inserisse um passo.
 */

import {
  EXEMPLO,
  criarEventoExemplo,
  criarProjetoExemplo,
  criarTaskExemplo,
  criarWorkspaceExemplo,
  type TourBuildResult,
} from './build';

export type TourPermission = 'company_admin' | 'workspace_admin';

/** Ids conhecidos no momento do passo. Ausente = o passo cai no cartão centralizado. */
export interface TourContext {
  companyId?: string;
  workspaceId?: string;
  projectId?: string;
}

/** Ação de construção do passo: cria o exemplo e devolve os ids que nasceram. */
export interface TourBuild {
  /** Rótulo do botão. */
  label: string;
  /** Confirmação exibida no lugar do botão depois de pronto. */
  done: string;
  run: (ctx: TourContext) => Promise<TourBuildResult>;
}

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** Valor do atributo `data-tour` do elemento a destacar. */
  anchor?: string;
  /** Tela do passo. `null` = ainda falta id no contexto para montar a rota. */
  route: (ctx: TourContext) => string | null;
  /** Só informativo: vira selo no cartão. Não esconde o passo de ninguém. */
  requires?: TourPermission;
  build?: TourBuild;
}

export const PERMISSION_LABEL: Record<TourPermission, string> = {
  company_admin: 'Requer admin da empresa',
  workspace_admin: 'Requer admin do workspace',
};

const rotaInicio = (ctx: TourContext) =>
  ctx.companyId ? `/empresa/${ctx.companyId}/inicio` : null;

const rotaKanban = (ctx: TourContext) =>
  ctx.workspaceId && ctx.projectId
    ? `/workspace/${ctx.workspaceId}/projetos/${ctx.projectId}`
    : null;

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'boas-vindas',
    title: 'Como o sistema se organiza',
    body: 'A hierarquia é workspace (área do time), projeto (trabalho com início e fim), task (entrega) e agenda (visão do período). O tutorial percorre essa ordem e cria o exemplo junto com você: a Campanha de Dia das Mães, da equipe de Marketing.',
    route: rotaInicio,
  },
  {
    id: 'workspace',
    title: 'Workspace — a área do time',
    body: 'O workspace é o espaço permanente de uma equipe: Marketing, Financeiro, Obras. Crie-o pelo botão abaixo ou pelo “+” ao lado de WORKSPACES, onde também se define quem participa.',
    anchor: 'sidebar-workspaces',
    route: (ctx) => (ctx.companyId ? `/empresa/${ctx.companyId}/workspaces` : null),
    requires: 'company_admin',
    build: {
      label: `Criar o workspace ${EXEMPLO.workspace}`,
      done: `Workspace ${EXEMPLO.workspace} criado.`,
      run: criarWorkspaceExemplo,
    },
  },
  {
    id: 'membros',
    title: 'Membros — quem participa',
    body: 'Cadastre a equipe com nome, e-mail e telefone. O convidado permanece em “Convites pendentes” até aceitar; somente então ocupa um usuário da assinatura.',
    anchor: 'sidebar-membros',
    route: (ctx) => (ctx.companyId ? `/empresa/${ctx.companyId}/membros` : null),
    requires: 'company_admin',
  },
  {
    id: 'projeto',
    title: 'Projeto — um trabalho com início e fim',
    body: 'Um workspace abriga vários projetos: “Campanha de Dia das Mães”, “Site novo”, “Feira de setembro”. Crie o primeiro pelo botão abaixo; em Novo projeto é possível definir nome, ícone e cor.',
    anchor: 'novo-projeto',
    route: (ctx) => (ctx.workspaceId ? `/workspace/${ctx.workspaceId}/projetos` : null),
    requires: 'workspace_admin',
    build: {
      label: `Criar o projeto ${EXEMPLO.projeto}`,
      done: `Projeto ${EXEMPLO.projeto} criado.`,
      run: criarProjetoExemplo,
    },
  },
  {
    id: 'colunas',
    title: 'Colunas — as etapas do fluxo',
    body: 'O projeto já nasce com três colunas: A Fazer, Em Progresso e Concluído — esta última marcada como coluna de tasks concluídas, que é como o sistema identifica o que terminou. Pelo menu de cada coluna é possível renomear, mudar a cor e acrescentar etapas.',
    anchor: 'kanban-coluna',
    route: rotaKanban,
  },
  {
    id: 'task',
    title: 'Task — a unidade de entrega',
    body: 'A task é a menor peça do sistema: um card com responsável, prazo e histórico. O botão abaixo cria a primeira na coluna A Fazer, com início e prazo para hoje; o “+” no topo da coluna faz o mesmo.',
    anchor: 'kanban-card',
    route: rotaKanban,
    build: {
      label: 'Criar a task de exemplo',
      done: `Task “${EXEMPLO.task}” criada, com prazo para hoje.`,
      run: criarTaskExemplo,
    },
  },
  {
    id: 'task-detalhe',
    title: 'Detalhamento da task',
    body: 'Ao abrir o card, defina descrição (Markdown), checklist, responsável e anexos. As datas de início e prazo, com hora, são o que leva a task para a agenda.',
    anchor: 'kanban-card',
    route: rotaKanban,
  },
  {
    id: 'mover',
    title: 'Movimentação entre colunas',
    body: 'Arraste o card conforme o trabalho avança: de A Fazer para Em Progresso e, ao concluir, para Concluído. Havendo convidados externos na task, o sistema oferece notificá-los da mudança.',
    anchor: 'kanban-card',
    route: rotaKanban,
  },
  {
    id: 'mencao',
    title: 'Comentários e menções',
    body: 'Nos comentários da task, digite “@” para mencionar um membro do workspace. A pessoa é notificada de imediato, e o aviso aparece neste sino.',
    anchor: 'notification-bell',
    route: rotaKanban,
  },
  {
    id: 'tempo',
    title: 'Registro de tempo',
    body: 'Na seção Tempo da task, use Iniciar e Encerrar para medir a duração do trabalho. Este painel exibe as sessões em andamento em qualquer tela.',
    anchor: 'tracking-widget',
    route: rotaKanban,
  },
  {
    id: 'agenda',
    title: 'Agenda — a visão do período',
    body: 'A agenda reúne as tasks datadas e os compromissos criados em “Novo evento”. A task deste tutorial já está aqui; o botão abaixo acrescenta um compromisso para hoje à tarde. Ajuste o alcance em Hoje, Esta Semana, Este Mês e Este Ano, e escolha entre data de início e prazo final.',
    anchor: 'agenda-header',
    route: rotaInicio,
    build: {
      label: 'Criar um compromisso de exemplo',
      done: `Compromisso “${EXEMPLO.evento}” criado para hoje, às 14h.`,
      run: criarEventoExemplo,
    },
  },
];

export const TOUR_TOTAL = TOUR_STEPS.length;
