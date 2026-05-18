import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles, Wrench, FileText, Tag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const APP_VERSION = "0.1.0-alpha.11";

type ChangeType = "feat" | "fix" | "chore";

interface ChangeEntry {
    type: ChangeType;
    text: string;
}

interface Release {
    version: string;
    date: string;
    changes: ChangeEntry[];
}

const releases: Release[] = [
    {
        version: "0.1.0-alpha.11",
        date: "2026-05-18",
        changes: [
            {
                type: "feat",
                text: "Lembretes de evento multi-canal — além de e-mail, agora notificam por toast in-app, som e notificação nativa do sistema operacional; toggles independentes em Perfil → Notificações (Lembrete de evento / Som / Pop-up no app / Notificação do navegador)",
            },
            {
                type: "feat",
                text: "Compartilhamento público de tasks com convidados externos via WhatsApp — link público com token opaco (SHA-256), edição restrita a campos seguros (título, descrição, prioridade, datas, coluna), histórico de alterações com identificação do guest e mensagens WhatsApp formatadas (negrito, riscado, itálico) com diff completo",
            },
            {
                type: "feat",
                text: "Agenda reage imediatamente a criação, edição, exclusão e RSVP de eventos — sem precisar recarregar a página; refetch automático do range visível",
            },
            {
                type: "feat",
                text: "Filtro por membros na aba Atividades — selecionar 1 ou N pessoas (busca inclui membros mesmo sem sessões ativas), badge com contagem e botão Limpar; disponível em empresa e workspace",
            },
            {
                type: "feat",
                text: "Kanban — botão \"Carregar mais\" por coluna em projetos grandes; arrastar-e-colar/colar imagem com upload direto; melhorias de acessibilidade nos dialogs",
            },
            {
                type: "feat",
                text: "Backend production-ready — endpoint /metrics no formato Prometheus, rate limiting por rota, hardening de configuração e otimizações de query do feed pessoal de tarefas",
            },
            {
                type: "fix",
                text: "Widget de tracking não mostra mais tasks excluídas — ao deletar uma task com sessão ativa, o backend encerra a sessão automaticamente e o widget reage via WebSocket",
            },
            {
                type: "fix",
                text: "Sidebar mantém o workspace atual expandido ao navegar para a Agenda — última seleção é persistida em localStorage por empresa",
            },
            {
                type: "fix",
                text: "Dispatcher de lembretes — triggers que caíram alguns segundos no passado agora disparam no próximo tick (até a hora do evento), evitando que lembretes criados perto da hora do evento fossem perdidos; idempotência via tabela calendar_event_reminders_sent",
            },
            {
                type: "chore",
                text: "Item de menu \"Acompanhamento\" renomeado para \"Atividades\" — consistente com o título da página",
            },
        ],
    },
    {
        version: "0.1.0-alpha.10",
        date: "2026-05-06",
        changes: [
            {
                type: "feat",
                text: "Gestão de eventos no calendário — criar, editar, excluir e visualizar eventos na agenda; suporte a recorrência (diária/semanal/mensal/anual), múltiplos convidados por e-mail, lembretes configuráveis, seletor de cor e horário; notificações por e-mail ao criar, atualizar e cancelar",
            },
            {
                type: "feat",
                text: "Agenda — clicar em uma task abre o dialog de detalhes diretamente na view de agenda sem sair da tela; filtro de data ampliado para \"Criação\", \"Prazo\" ou ambos simultâneos (modo OR)",
            },
            {
                type: "feat",
                text: "Modo privacidade — botão na agenda ofusca os títulos das tasks visíveis na tela; estado gerenciado via Zustand e aplicado em todos os componentes de card",
            },
        ],
    },
    {
        version: "0.1.0-alpha.9",
        date: "2026-04-28",
        changes: [
            {
                type: "feat",
                text: "Sticky notes — criar, editar, colorir e excluir notas adesivas no workspace; seção de notas vinculadas a tasks no dialog de detalhes",
            },
            {
                type: "feat",
                text: "Checklists em tasks — criar, editar, reordenar e excluir itens de checklist com barra de progresso no dialog de detalhes",
            },
            {
                type: "feat",
                text: "Markdown editor — entrar em modo de edição com duplo clique ou pressionar qualquer tecla; sair com Escape",
            },
            {
                type: "feat",
                text: "Agenda estilo Google Calendar — aba \"Atividades\" renomeada para \"Agenda\" com views Hoje, Esta Semana, Este Mês e Este Ano; destaque visual no dia atual (círculo azul); popover de tarefas ao clicar em um dia nas views de mês e ano; navegação temporal com setas e botão \"Hoje\"",
            },
            {
                type: "feat",
                text: "DatePicker personalizado — campo de data nativo substituído por picker consistente com o design system em todas as telas",
            },
            {
                type: "fix",
                text: "Hydration mismatch eliminado no sidebar e widget de rastreamento de tempo — componentes SSR/client alinhados corretamente",
            },
            {
                type: "fix",
                text: "Favicon corrigido — arquivo multi-tamanho (16×16, 32×32, ICO) exibido corretamente na aba do navegador",
            },
            {
                type: "chore",
                text: "Tabela de workspaces — ações condensadas em menu dropdown de 3 pontos no mobile; descrições longas truncadas com tooltip no desktop",
            },
            {
                type: "chore",
                text: "Sidebar — link duplicado \"Workspaces\" removido; acesso à lista de workspaces movido para ícone de engrenagem no cabeçalho da seção",
            },
        ],
    },
    {
        version: "0.1.0-alpha.8",
        date: "2026-04-07",
        changes: [
            {
                type: "feat",
                text: "Rastreamento de tempo por task — botão \"Iniciar\" no dialog de detalhes; widget fixo no canto inferior direito com timer ao vivo, pause e encerrar; visível em todas as páginas (dashboard, empresa e workspace)",
            },
            {
                type: "feat",
                text: "Acompanhamento de atividades em tempo real — admins da empresa visualizam todas as tarefas em execução dos membros agrupadas por pessoa, com timer ao vivo via WebSocket; membros colapsáveis individualmente",
            },
            {
                type: "feat",
                text: "Destaque visual no card do kanban quando o usuário tem uma sessão ativa naquela task (ring colorido)",
            },
            {
                type: "feat",
                text: "Aviso nativo do browser ao tentar fechar ou recarregar a página com sessões em execução",
            },
            {
                type: "fix",
                text: "TypeError ao receber evento WebSocket taskSession:started — payload WS é flat (TaskSessionStartedPayload) enquanto rawToActiveSession esperava formato aninhado; ActiveSession agora é construída diretamente do payload",
            },
            {
                type: "fix",
                text: "Link \"Ver card\" nas páginas de atividades usava ?taskId= mas o KanbanBoard lê ?task= — corrigido para abrir o dialog de detalhes corretamente",
            },
            {
                type: "fix",
                text: "Mensagem de erro ao atingir limite de 3 tarefas simultâneas exibida abaixo do botão \"Iniciar\" no dialog de detalhes",
            },
            {
                type: "chore",
                text: "Botão \"Excluir task\" movido para abaixo de \"Mover\" no painel lateral do dialog (sempre visível, sem scroll); cursor-pointer adicionado em todos os elementos clicáveis do card",
            },
        ],
    },
    {
        version: "0.1.0-alpha.7",
        date: "2026-04-06",
        changes: [
            {
                type: "feat",
                text: "Copiar ou mover tasks entre projetos — menu de contexto no card (clique direito) e botões no dialog de detalhes; dialog em 2 etapas para escolher destino e quais dados transferir (responsáveis, labels, comentários, anexos, datas, histórico)",
            },
            {
                type: "feat",
                text: "Enter simples no editor markdown agora cria quebra de linha visível — comportamento consistente com editores modernos (GitHub-style breaks)",
            },
            {
                type: "feat",
                text: "Salvamento ao fechar dialog — campos da task só são enviados ao servidor quando o usuário fecha o card, eliminando múltiplos requests durante a digitação",
            },
            {
                type: "fix",
                text: "Hydration mismatch do Radix UI no layout da empresa — NotificationBell agora renderiza somente no cliente (ssr:false), corrigindo IDs aria-controls divergentes entre servidor e cliente",
            },
            {
                type: "feat",
                text: "Colunas podem ser marcadas como \"concluída\" — tasks nessas colunas deixam de aparecer como atrasadas (badge vermelho no card) e são excluídas dos filtros de data da página inicial (hoje, amanhã, atrasadas)",
            },
        ],
    },
    {
        version: "0.1.0-alpha.6",
        date: "2026-03-25",
        changes: [
            {
                type: "feat",
                text: "Arrastar ou colar imagem diretamente no dialog de detalhes da task — upload direto para anexos sem precisar abrir a seção; overlay de drag-over e barra de status inline",
            },
            {
                type: "feat",
                text: "Descrição da task colapsável — preview truncado a ~5 linhas com gradiente e toggle \"Ver mais / Ver menos\"",
            },
            {
                type: "fix",
                text: "Dialog de detalhes da task aparecia deslocado para baixo da tela — `relative` sobrescrevia `fixed` via tailwind-merge, removendo o posicionamento centralizado",
            },
            {
                type: "fix",
                text: "Hydration mismatch do Radix UI — NotificationBell agora renderiza apenas no cliente via wrapper com ssr:false; removidos guards mounted redundantes de UserMenu e SidebarShell",
            },
        ],
    },
    {
        version: "0.1.0-alpha.5",
        date: "2026-03-19",
        changes: [
            {
                type: "feat",
                text: "Ordenação personalizada da sidebar por drag-and-drop — workspaces e projetos podem ser reordenados individualmente; posições persistidas por usuário no banco",
            },
            {
                type: "feat",
                text: "Mover projeto entre workspaces via drag-and-drop na sidebar",
            },
            {
                type: "feat",
                text: 'Filtro por reporter no board filter do kanban — seção dedicada no painel, chips ativos e limpeza com "Limpar"',
            },
            {
                type: "fix",
                text: "Ranking de busca de membros no task-detail-dialog — nomes que começam com o termo de busca aparecem antes de nomes que apenas o contêm",
            },
            {
                type: "chore",
                text: "Migration add_user_sidebar_order — tabelas user_workspace_orders e user_project_orders; removida coluna notification_id de tasks; constraints de cascade em task_history corrigidas",
            },
        ],
    },
    {
        version: "0.1.0-alpha.4",
        date: "2026-03-18",
        changes: [
            {
                type: "feat",
                text: "Tela de início (dashboard pessoal) com saudação por hora do dia, tarefas a vencer com filtros (hoje / amanhã / esta semana / atrasadas / personalizado) e feed de notificações recentes",
            },
            {
                type: "feat",
                text: "Numeração automática de tasks (#N) com contador atômico por projeto — exibida nos cards do kanban como prefixo derivado do nome do projeto (ex: BE-42)",
            },
            {
                type: "feat",
                text: "Visão geral do workspace — todos os projetos com tasks agrupadas por coluna, filtros de assignee e label, e deep-link para task via taskRef",
            },
            {
                type: "feat",
                text: "Color picker para colunas do kanban com preset de cores e opção de limpar",
            },
            {
                type: "feat",
                text: "Board filter no kanban — filtro global por assignee e labels aplicado a todas as colunas simultaneamente",
            },
            {
                type: "feat",
                text: "Sort multi-critério nas colunas — eixos independentes de dueDate e priority",
            },
            {
                type: "feat",
                text: 'Link "Workspaces" separado na sidebar; "Início" agora aponta para o dashboard pessoal',
            },
            {
                type: "fix",
                text: "Redirecionamento pós-login e seleção de empresa agora aterrisam em /inicio em vez de /workspaces",
            },
            {
                type: "chore",
                text: "Migration add_task_numbering — colunas task_counter e task_number adicionadas ao banco de dados",
            },
        ],
    },
    {
        version: "0.1.0-alpha.3",
        date: "2026-03-18",
        changes: [
            {
                type: "feat",
                text: "Ícone e cor personalizados por projeto — picker com 50+ ícones Lucide, persistido no banco",
            },
            {
                type: "feat",
                text: "Sistema de broadcast — empresa envia comunicados para membros de workspaces; superadmin envia globalmente",
            },
            {
                type: "feat",
                text: "Alternância de tema dark/light com next-themes",
            },
            { type: "feat", text: "Módulo de upload de arquivos no backend" },
            {
                type: "feat",
                text: "Toggle de superusuário no painel superadmin",
            },
            {
                type: "fix",
                text: "Ícone do projeto não atualizava na sidebar após edição — SidebarProject agora inclui icon/iconColor, evento projeto:updated propaga os campos",
            },
        ],
    },
    {
        version: "0.1.0-alpha.2",
        date: "2026-03-17",
        changes: [
            {
                type: "fix",
                text: "Nome do projeto não atualizava na sidebar após edição — EditProjetoDialog agora despacha CustomEvent e WorkspaceNavItem atualiza in-place sem chamada de rede",
            },
            {
                type: "chore",
                text: "Documentação do banco de dados atualizada para v2.0 com todas as tabelas do schema atual (task_assignees, labels, task_labels, task_history, task_comments, task_attachments, project_restrictions, notifications, notification_preferences)",
            },
        ],
    },
    {
        version: "0.1.0-alpha.1",
        date: "2026-03-11",
        changes: [
            {
                type: "feat",
                text: "Auth — login, first-access e reset de senha",
            },
            {
                type: "feat",
                text: "Multi-tenant: Superusuário → Empresa → Workspace → Projeto → Task",
            },
            { type: "feat", text: "Kanban board com colunas e drag-and-drop" },
            {
                type: "feat",
                text: "RBAC via tabela Memberships com roles (superuser, admin, workspace_admin, member)",
            },
            {
                type: "feat",
                text: "Comentários em tasks — criar, editar e excluir",
            },
            { type: "feat", text: "Histórico de alterações de tasks" },
            {
                type: "feat",
                text: "Links em destaque e @menções nos comentários",
            },
            {
                type: "feat",
                text: "Seções de comentários e histórico colapsáveis",
            },
        ],
    },
];

const changeConfig: Record<
    ChangeType,
    { icon: React.ElementType; label: string; className: string }
> = {
    feat: {
        icon: Sparkles,
        label: "Novo",
        className: "text-violet-500 dark:text-violet-400",
    },
    fix: {
        icon: Wrench,
        label: "Fix",
        className: "text-amber-500 dark:text-amber-400",
    },
    chore: {
        icon: FileText,
        label: "Chore",
        className: "text-muted-foreground",
    },
};

function versionBadgeClass(version: string) {
    if (version.includes("alpha"))
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    if (version.includes("beta"))
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
    if (version.includes("rc"))
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    return "bg-primary/10 text-primary border-primary/20";
}

function formatDate(iso: string) {
    const [year, month, day] = iso.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(year, month - 1, day));
}

export default function SobrePage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Slim header */}
            <div className="border-b">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Voltar"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <span className="text-sm font-medium">Sobre o sistema</span>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
                {/* Hero */}
                <div className="flex flex-col items-center text-center gap-4">
                    <Image
                        src="/taskDY/taskDY.png"
                        alt="TaskDY"
                        width={80}
                        height={80}
                        className="h-20 w-auto"
                    />
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            TaskDY
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Plataforma de gestão de projetos Kanban com
                            hierarquia multi-tenant.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                                versionBadgeClass(APP_VERSION),
                            )}
                        >
                            <Tag className="h-3 w-3" />v{APP_VERSION}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            versão atual
                        </span>
                    </div>
                </div>

                <Separator />

                {/* Changelog */}
                <div className="space-y-1">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Changelog
                    </h2>
                </div>

                <div className="relative space-y-8">
                    {/* Vertical timeline line */}
                    <div
                        className="absolute left-[7px] top-2 bottom-2 w-px bg-border"
                        aria-hidden
                    />

                    {releases.map((release, idx) => (
                        <div key={release.version} className="relative pl-8">
                            {/* Timeline dot */}
                            <div
                                className={cn(
                                    "absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-background",
                                    idx === 0
                                        ? "border-primary"
                                        : "border-muted-foreground/40",
                                )}
                            />

                            {/* Card */}
                            <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
                                {/* Header */}
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                                                versionBadgeClass(
                                                    release.version,
                                                ),
                                            )}
                                        >
                                            <Tag className="h-3 w-3" />v
                                            {release.version}
                                        </span>
                                        {idx === 0 && (
                                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground uppercase tracking-wide">
                                                atual
                                            </span>
                                        )}
                                    </div>
                                    <time className="text-xs text-muted-foreground">
                                        {formatDate(release.date)}
                                    </time>
                                </div>

                                {/* Changes list */}
                                <ul className="space-y-2.5">
                                    {release.changes.map((change, i) => {
                                        const { icon: Icon, className } =
                                            changeConfig[change.type];
                                        return (
                                            <li
                                                key={i}
                                                className="flex gap-2.5"
                                            >
                                                <Icon
                                                    className={cn(
                                                        "mt-0.5 h-4 w-4 shrink-0",
                                                        className,
                                                    )}
                                                />
                                                <span className="text-sm leading-relaxed text-foreground/85">
                                                    {change.text}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <Separator />
                <p className="text-center text-xs text-muted-foreground pb-6">
                    TaskDY · Semantic Versioning · {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
