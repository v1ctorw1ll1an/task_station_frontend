"use client";

import { useReadOnly } from "@/components/billing/billing-mode";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type CollisionDetection,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Wifi, WifiOff } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KanbanColumnComponent } from "./kanban-column";
import { KanbanCard, type KanbanTask } from "./kanban-card";
import { KanbanBoardFilter, EMPTY_BOARD_FILTER, type KanbanBoardFilterState } from "./kanban-board-filter";
import { TaskDetailDialog } from "./task-detail-dialog";
import { SendChangesDialog } from "./send-changes-dialog";
import { listGuestsAction, type TaskGuestSummary } from "@/actions/projeto/list-guests.action";
import { getTaskHistoryAction } from "@/actions/projeto/get-task-history.action";
import { moveTaskAction } from "@/actions/projeto/move-task.action";
import { reorderColunasAction } from "@/actions/projeto/reorder-colunas.action";
import {
    createColunaAction,
    CreateColunaActionState,
} from "@/actions/projeto/create-coluna.action";
import type { ProjectLabel } from "@/actions/projeto/get-labels.action";
import { LabelsManager } from "./labels-manager";
import { TrashDialog } from "./trash-dialog";
import { useKanbanStore } from "@/lib/stores/kanban-store";
import { useKanbanSocket } from "@/hooks/use-kanban-socket";

export type { ProjectLabel };

export interface KanbanColumn {
    id: string;
    name: string;
    color: string | null;
    order: number;
    isDone: boolean;
    tasks: KanbanTask[];
    totalTasks?: number;
}

interface KanbanData {
    columns: KanbanColumn[];
    projectName?: string;
}

export interface WorkspaceMember {
    id: string;
    name: string;
    email: string;
    photoUrl: string | null;
}

interface KanbanBoardProps {
    data: KanbanData;
    projectId: string;
    workspaceId: string;
    isAdmin: boolean;
    membros: WorkspaceMember[];
    labels: ProjectLabel[];
    currentUserId: string;
    token: string;
}

const initialCreateColunaState: CreateColunaActionState = {};

export function computeTaskPrefix(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) return words.map((w) => w[0].toUpperCase()).join('');
    return words[0]?.slice(0, 3).toUpperCase() ?? 'TSK';
}

export function KanbanBoard({
    data,
    projectId,
    workspaceId,
    isAdmin,
    membros,
    labels,
    currentUserId,
    token,
}: KanbanBoardProps) {
    const readOnly = useReadOnly();
    const store = useKanbanStore();
    const columns = useKanbanStore((s) => s.columns);
    const taskPrefix = computeTaskPrefix(data.projectName ?? '');
    const router = useRouter();
    const pathname = usePathname();

    // Hidrata o store com os dados do servidor no mount e ao trocar de projeto
    useEffect(() => {
        store.hydrate({
            projectId,
            currentUserId,
            columns: data.columns,
            labels,
            membros,
        });
    }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

    const searchParams = useSearchParams();
    const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
    const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
    const dragSourceColumnIdRef = useRef<string | null>(null);
    const [sendChanges, setSendChanges] = useState<{
        taskId: string;
        guests: TaskGuestSummary[];
        historyIds: string[];
    } | null>(null);

    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
        searchParams.get('task'),
    );

    useEffect(() => {
        setSelectedTaskId(searchParams.get('task'));
    }, [searchParams]);

    // WebSocket substituindo o polling
    const { socketStatus } = useKanbanSocket(projectId, token);

    // Deriva selectedTask do store (reflete updates do socket automaticamente)
    const selectedTask = selectedTaskId
        ? (columns
              .flatMap((c) => c.tasks)
              .find((t) => t.id === selectedTaskId) ?? null)
        : null;

    const [boardFilter, setBoardFilter] = useState<KanbanBoardFilterState>(EMPTY_BOARD_FILTER);
    const [createColOpen, setCreateColOpen] = useState(false);
    const [, startTransition] = useTransition();

    const [createColunaState, createColunaFormAction, isCreateColPending] =
        useActionState(createColunaAction, initialCreateColunaState);

    useEffect(() => {
        if (createColunaState.success) {
             
            setCreateColOpen(false);
            // Sem router.refresh() — o evento column:created via socket atualiza o store
        }
    }, [createColunaState.success]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
    );

    const collisionDetection = useCallback<CollisionDetection>(
        (args) => {
            if (activeColumnId) {
                return closestCenter({
                    ...args,
                    droppableContainers: args.droppableContainers.filter(
                        (c) => c.data.current?.type === "column",
                    ),
                });
            }
            return closestCenter(args);
        },
        [activeColumnId],
    );

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        if (active.data.current?.type === "task") {
            const t = active.data.current.task as KanbanTask;
            setActiveTask(t);
            dragSourceColumnIdRef.current = t.columnId;
        } else if (active.data.current?.type === "column") {
            setActiveColumnId(active.id as string);
        }
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;
        if (active.data.current?.type !== "task") return;

        const activeTaskData = active.data.current.task as KanbanTask;
        const overId = over.id as string;

        let targetColumnId: string | null = null;
        if (over.data.current?.type === "column") {
            targetColumnId = overId;
        } else if (over.data.current?.type === "task") {
            const overTask = over.data.current.task as KanbanTask;
            targetColumnId = overTask.columnId;
        }

        if (!targetColumnId || targetColumnId === activeTaskData.columnId)
            return;

        // Update visual otimista durante o drag (via store)
        store.setColumns(
            columns.map((col) => {
                if (col.id === activeTaskData.columnId) {
                    return {
                        ...col,
                        tasks: col.tasks.filter(
                            (t) => t.id !== activeTaskData.id,
                        ),
                    };
                }
                if (col.id === targetColumnId) {
                    const updatedTask = {
                        ...activeTaskData,
                        columnId: targetColumnId!,
                    };
                    return { ...col, tasks: [...col.tasks, updatedTask] };
                }
                return col;
            }),
        );
    }

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveTask(null);
            setActiveColumnId(null);

            if (!over) return;

            // Reordenar colunas
            if (
                active.data.current?.type === "column" &&
                over.data.current?.type === "column"
            ) {
                const activeId = active.id as string;
                const overId = over.id as string;
                if (activeId === overId) return;

                const colIds = columns.map((c) => c.id);
                const newOrder = arrayMove(
                    colIds,
                    colIds.indexOf(activeId),
                    colIds.indexOf(overId),
                );

                store.optimisticReorderColumns(newOrder);
                startTransition(async () => {
                    await reorderColunasAction(
                        projectId,
                        workspaceId,
                        newOrder,
                    );
                    // Sem router.refresh() — o evento column:reordered via socket atualiza outros clientes
                    // Este cliente já aplicou otimisticamente e o socket vai ignorar (actorId skip não se aplica a colunas)
                });
                return;
            }

            // Mover task
            if (active.data.current?.type === "task") {
                const draggedTask = active.data.current.task as KanbanTask;
                const overId = over.id as string;

                let targetColumnId: string;
                let afterTaskId: string | null = null;

                if (over.data.current?.type === "column") {
                    targetColumnId = overId;
                    const targetTasks =
                        columns
                            .find((c) => c.id === targetColumnId)
                            ?.tasks.filter((t) => t.id !== draggedTask.id) ??
                        [];
                    afterTaskId =
                        targetTasks.length > 0
                            ? targetTasks[targetTasks.length - 1].id
                            : null;
                } else if (over.data.current?.type === "task") {
                    const overTask = over.data.current.task as KanbanTask;
                    targetColumnId = overTask.columnId;

                    const targetCol = columns.find(
                        (c) => c.id === targetColumnId,
                    )!;
                    const colTaskIds = targetCol.tasks.map((t) => t.id);
                    const fromIdx = colTaskIds.indexOf(draggedTask.id);
                    const toIdx = colTaskIds.indexOf(overId);

                    if (fromIdx !== -1 && toIdx !== -1) {
                        const reordered = arrayMove(colTaskIds, fromIdx, toIdx);
                        const newPos = reordered.indexOf(draggedTask.id);
                        afterTaskId =
                            newPos === 0 ? null : reordered[newPos - 1];
                    } else {
                        afterTaskId = overTask.id;
                    }
                } else {
                    return;
                }

                const capturedTargetColumnId = targetColumnId;
                const capturedAfterTaskId = afterTaskId;
                const capturedDraggedTask = draggedTask;

                // Aplica o update visual otimisticamente via store
                store.optimisticMoveTask(
                    capturedDraggedTask.id,
                    capturedDraggedTask.columnId,
                    capturedTargetColumnId,
                    capturedAfterTaskId,
                );

                const sourceColumnId =
                    dragSourceColumnIdRef.current ?? capturedDraggedTask.columnId;
                dragSourceColumnIdRef.current = null;
                const changedColumn = sourceColumnId !== capturedTargetColumnId;
                const since = Date.now();

                startTransition(async () => {
                    await moveTaskAction(
                        projectId,
                        capturedDraggedTask.id,
                        workspaceId,
                        capturedTargetColumnId,
                        capturedAfterTaskId,
                    );
                    // Sem router.refresh() — o evento task:moved via socket atualiza outros clientes
                    // Este cliente usou actorId skip e já tem o estado correto

                    // Se a task mudou de coluna e tem convidados, abre o pop-up
                    // de notificação com a nova entrada de TaskHistory (columnId).
                    if (!changedColumn) return;
                    try {
                        const [guestsRes, historyPage] = await Promise.all([
                            listGuestsAction(projectId, capturedDraggedTask.id),
                            getTaskHistoryAction(projectId, capturedDraggedTask.id, 1, 100),
                        ]);
                        const guests = guestsRes.guests ?? [];
                        const mine = historyPage.data
                            .filter((h) => h.user?.id === currentUserId)
                            .filter((h) => new Date(h.changedAt).getTime() >= since);
                        if (guests.length > 0 && mine.length > 0) {
                            setSendChanges({
                                taskId: capturedDraggedTask.id,
                                guests,
                                historyIds: mine.map((h) => h.id),
                            });
                        }
                    } catch {
                        // silently ignore
                    }
                });
            }
        },
        [columns, projectId, workspaceId, store, startTransition, currentUserId],
    );

    const activeTaskData = activeTask
        ? (columns
              .flatMap((c) => c.tasks)
              .find((t) => t.id === activeTask.id) ?? activeTask)
        : null;

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-2 flex-shrink-0 gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                    <ConnectionIndicator status={socketStatus} />
                    <KanbanBoardFilter
                        columns={columns}
                        labels={labels}
                        filter={boardFilter}
                        onFilterChange={setBoardFilter}
                    />
                </div>
                {isAdmin && (
                    <div className="flex gap-2 shrink-0">
                        <TrashDialog
                            projectId={projectId}
                            workspaceId={workspaceId}
                        />
                        <LabelsManager
                            projectId={projectId}
                            workspaceId={workspaceId}
                            labels={labels}
                        />
                    </div>
                )}
            </div>

            <DndContext
                // Somente leitura: sem sensores, o arrastar simplesmente não engata
                // (o backend recusaria a reordenação de qualquer forma).
                sensors={readOnly ? [] : sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-row gap-3 md:gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
                    <SortableContext
                        items={columns.map((c) => c.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        {columns.map((col) => (
                            <KanbanColumnComponent
                                key={col.id}
                                column={col}
                                allColumns={columns}
                                projectId={projectId}
                                workspaceId={workspaceId}
                                isAdmin={isAdmin}
                                labels={labels}
                                taskPrefix={taskPrefix}
                                boardFilter={boardFilter}
                                onTaskClick={setSelectedTaskId}
                            />
                        ))}
                    </SortableContext>

                    {isAdmin && !readOnly && (
                        <Dialog
                            open={createColOpen}
                            onOpenChange={setCreateColOpen}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-64 md:w-72 flex-shrink-0 h-12 border-dashed text-muted-foreground self-start"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nova coluna
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>Nova coluna</DialogTitle>
                                </DialogHeader>
                                <form
                                    action={createColunaFormAction}
                                    className="space-y-4"
                                >
                                    <input
                                        type="hidden"
                                        name="projectId"
                                        value={projectId}
                                    />
                                    <input
                                        type="hidden"
                                        name="workspaceId"
                                        value={workspaceId}
                                    />
                                    <div className="space-y-2">
                                        <Label htmlFor="new-col-name">
                                            Nome
                                        </Label>
                                        <Input
                                            id="new-col-name"
                                            name="name"
                                            placeholder="Ex: Em Review"
                                            autoFocus
                                        />
                                    </div>
                                    {createColunaState.error && (
                                        <p className="text-sm text-destructive">
                                            {createColunaState.error}
                                        </p>
                                    )}
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setCreateColOpen(false)
                                            }
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isCreateColPending}
                                        >
                                            {isCreateColPending
                                                ? "Criando..."
                                                : "Criar"}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <DragOverlay>
                    {activeTaskData && (
                        <KanbanCard
                            task={activeTaskData}
                            taskPrefix={taskPrefix}
                            onClick={() => {}}
                            isDragOverlay
                        />
                    )}
                </DragOverlay>
            </DndContext>

            <TaskDetailDialog
                key={selectedTask?.id ?? ""}
                task={selectedTask}
                taskPrefix={taskPrefix}
                projectId={projectId}
                workspaceId={workspaceId}
                isAdmin={isAdmin}
                membros={membros}
                labels={labels}
                currentUserId={currentUserId}
                onClose={() => {
                    setSelectedTaskId(null);
                    router.replace(pathname, { scroll: false });
                }}
                onRequestSendChanges={(data) => setSendChanges(data)}
            />
            {sendChanges && (
                <SendChangesDialog
                    open
                    onOpenChange={(open) => {
                        if (!open) setSendChanges(null);
                    }}
                    projectId={projectId}
                    taskId={sendChanges.taskId}
                    guests={sendChanges.guests}
                    historyEntryIds={sendChanges.historyIds}
                />
            )}
        </div>
    );
}

// ── ConnectionIndicator ────────────────────────────────────────────────────────

import type { SocketStatus } from "@/hooks/use-kanban-socket";

function ConnectionIndicator({ status }: { status: SocketStatus }) {
    if (status === "connected") {
        return (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground select-none"></span>
        );
    }
    if (status === "connecting") {
        return (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
                <Wifi className="h-3.5 w-3.5 animate-pulse" />
                Conectando...
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
            <WifiOff className="h-3.5 w-3.5 text-amber-500" />
            Reconectando...
        </span>
    );
}
