import Link from "next/link";
import { ArrowLeft, Sparkles, Wrench, FileText, Tag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const APP_VERSION = "0.1.0-alpha.6";

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
                    <img
                        src="/taskDY/taskDY.png"
                        alt="TaskDY"
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
