/**
 * Criação do exemplo do tutorial.
 *
 * O tour não se limita a dizer "clique aqui e crie": cada passo de construção traz um
 * botão que cria a coisa de verdade, com as mesmas server actions que os formulários da
 * aplicação usam. Sem isso o tutorial travava no primeiro passo de quem acabou de se
 * cadastrar — sem workspace não há projeto, sem projeto não há quadro, e os passos
 * seguintes só sabiam apontar para o vazio.
 *
 * **Toda função aqui é idempotente**: antes de criar, procura pelo nome e reaproveita o
 * que já existe. O tutorial pode ser reaberto a qualquer momento pelo menu do usuário, e
 * rodá-lo três vezes não pode deixar três workspaces "Marketing" para trás.
 */

import { fetchWorkspacesAction } from '@/actions/empresa/fetch-workspaces.action';
import { createWorkspaceAction } from '@/actions/empresa/create-workspace.action';
import { getWorkspaceProjectsForSidebar } from '@/actions/workspace/get-projetos-sidebar.action';
import { createProjetoAction } from '@/actions/workspace/create-projeto.action';
import { getKanbanDataAction } from '@/actions/projeto/get-kanban.action';
import { createTaskAction } from '@/actions/projeto/create-task.action';
import { listMyEventsAction } from '@/actions/eventos/list-my-events.action';
import { createEventAction } from '@/actions/eventos/create-event.action';
import { BROWSER_TZ, combineDateAndTime, dateInTz } from '@/lib/datetime';
import type { TourContext } from './steps';

/**
 * Nomes do exemplo. Constantes porque servem a três coisas ao mesmo tempo: o texto do
 * passo, o que é criado e a busca que evita duplicar — e as três precisam bater.
 */
export const EXEMPLO = {
  workspace: 'Marketing',
  projeto: 'Campanha de Dia das Mães',
  task: 'Gravar o vídeo do Instagram',
  evento: 'Alinhamento da campanha',
} as const;

/** `ctx` = ids descobertos ou criados; `error` = mensagem para o cartão do tour. */
export interface TourBuildResult {
  ctx?: TourContext;
  error?: string;
}

/** Dia de hoje (YYYY-MM-DD) no fuso do navegador. */
function hoje(): string {
  return dateInTz(new Date().toISOString(), BROWSER_TZ);
}

export async function criarWorkspaceExemplo(ctx: TourContext): Promise<TourBuildResult> {
  const companyId = ctx.companyId;
  if (!companyId) return { error: 'Empresa não identificada.' };

  const { data } = await fetchWorkspacesAction(companyId, 1, EXEMPLO.workspace);
  const existente = data.find((w) => w.name === EXEMPLO.workspace);
  if (existente) return { ctx: { workspaceId: existente.id } };

  const form = new FormData();
  form.set('companyId', companyId);
  form.set('name', EXEMPLO.workspace);

  const r = await createWorkspaceAction({}, form);
  if (!r.workspaceId) return { error: r.error ?? 'Não foi possível criar o workspace.' };
  return { ctx: { workspaceId: r.workspaceId } };
}

export async function criarProjetoExemplo(ctx: TourContext): Promise<TourBuildResult> {
  const workspaceId = ctx.workspaceId;
  if (!workspaceId) return { error: 'Crie o workspace antes deste passo.' };

  const projetos = await getWorkspaceProjectsForSidebar(workspaceId);
  const existente = projetos.find((p) => p.name === EXEMPLO.projeto);
  if (existente) return { ctx: { projectId: existente.id } };

  const form = new FormData();
  form.set('workspaceId', workspaceId);
  form.set('name', EXEMPLO.projeto);
  form.set('icon', 'Megaphone');
  form.set('iconColor', '#ec4899');

  const r = await createProjetoAction({}, form);
  if (!r.projectId) return { error: r.error ?? 'Não foi possível criar o projeto.' };
  return { ctx: { projectId: r.projectId } };
}

/**
 * Cria a task na primeira coluna, com início e prazo hoje — as datas não são enfeite:
 * são o que faz a task aparecer na agenda no último passo do tutorial.
 */
export async function criarTaskExemplo(ctx: TourContext): Promise<TourBuildResult> {
  const { workspaceId, projectId } = ctx;
  if (!workspaceId || !projectId) return { error: 'Crie o projeto antes deste passo.' };

  const kanban = await getKanbanDataAction(projectId);
  if (!kanban) return { error: 'Não foi possível ler o quadro do projeto.' };

  const jaExiste = kanban.columns.some((c) => c.tasks.some((t) => t.title === EXEMPLO.task));
  if (jaExiste) return {};

  const primeira = kanban.columns[0];
  if (!primeira) return { error: 'O projeto não tem colunas.' };

  const dia = hoje();
  const form = new FormData();
  form.set('projectId', projectId);
  form.set('workspaceId', workspaceId);
  form.set('columnId', primeira.id);
  form.set('title', EXEMPLO.task);
  form.set('description', 'Roteiro, gravação e legendas do vídeo de lançamento.');
  form.set('priority', 'high');
  form.set('startDate', combineDateAndTime(dia, '09:00', false, BROWSER_TZ));
  form.set('dueDate', combineDateAndTime(dia, '17:00', false, BROWSER_TZ));

  const r = await createTaskAction({}, form);
  if (r.error) return { error: r.error };
  return {};
}

export async function criarEventoExemplo(ctx: TourContext): Promise<TourBuildResult> {
  const companyId = ctx.companyId;
  if (!companyId) return { error: 'Empresa não identificada.' };

  const dia = hoje();
  const inicio = combineDateAndTime(dia, '14:00', false, BROWSER_TZ);
  const fim = combineDateAndTime(dia, '15:00', false, BROWSER_TZ);
  if (!inicio || !fim) return { error: 'Não foi possível calcular o horário.' };

  const { data } = await listMyEventsAction(inicio, fim, companyId);
  if (data.some((e) => e.title === EXEMPLO.evento)) return {};

  const form = new FormData();
  form.set('companyId', companyId);
  form.set('title', EXEMPLO.evento);
  form.set('startsAt', inicio);
  form.set('endsAt', fim);
  form.set('allDay', 'false');
  form.set('timezone', BROWSER_TZ);

  const r = await createEventAction({}, form);
  if (r.error) return { error: r.error };
  return {};
}
