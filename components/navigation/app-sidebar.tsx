"use client";

import { useState, useEffect, useRef, startTransition, useCallback } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
    Activity,
    Home,
    LayoutGrid,
    Megaphone,
    Users,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
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
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { useMobileNav } from "./sidebar-shell";
import { WorkspaceNavItem, SidebarWorkspace } from "./workspace-nav-item";
import { CreateWorkspaceInlineTrigger } from "./create-workspace-inline";
import { gravatarUrl } from "@/lib/gravatar";
import { getProfileAction } from "@/actions/perfil/get-profile.action";
import {
    getWorkspaceProjectsForSidebar,
    SidebarProject,
} from "@/actions/workspace/get-projetos-sidebar.action";
import { type ProjectOrderEntry } from "@/actions/me/get-sidebar-order.action";
import { saveWorkspaceOrderAction } from "@/actions/me/save-workspace-order.action";
import { saveProjectOrderAction } from "@/actions/me/save-project-order.action";
import { moveProjectToWorkspaceAction } from "@/actions/workspace/move-project-workspace.action";

interface AppSidebarProps {
    companyId: string;
    companyName: string;
    isCompanyAdmin: boolean;
    workspaces: SidebarWorkspace[];
    userEmail: string;
    initialProjectOrders?: ProjectOrderEntry[];
    forceExpanded?: boolean;
    onNavigate?: () => void;
}

type ActiveDrag =
    | { type: "workspace"; id: string }
    | { type: "project"; id: string; originalWorkspaceId: string };

interface SidebarOrderCache {
    workspaceIds: string[];
    projectIds: Record<string, string[]>;
}

// When dragging a workspace, only consider other workspace containers as drop targets.
// Without this, closestCenter may resolve to a project inside an expanded workspace,
// causing handleDragEnd to receive a project ID as `over.id` → findIndex returns -1 → reorder aborted.
const collisionDetection: CollisionDetection = (args) => {
    if (args.active.data.current?.type === "workspace") {
        return closestCenter({
            ...args,
            droppableContainers: args.droppableContainers.filter(
                (c) => c.data.current?.type === "workspace",
            ),
        });
    }
    return closestCenter(args);
};

function storageKey(companyId: string) {
    return `sidebar-order-${companyId}`;
}

function readCache(companyId: string): SidebarOrderCache | null {
    try {
        const raw = localStorage.getItem(storageKey(companyId));
        if (!raw) return null;
        return JSON.parse(raw) as SidebarOrderCache;
    } catch {
        return null;
    }
}

function writeCache(companyId: string, cache: SidebarOrderCache) {
    try {
        localStorage.setItem(storageKey(companyId), JSON.stringify(cache));
    } catch {
        // storage full or unavailable — ignore
    }
}

function applyWorkspaceOrder(
    workspaces: SidebarWorkspace[],
    ids: string[],
): SidebarWorkspace[] {
    const posMap = new Map(ids.map((id, i) => [id, i]));
    return [...workspaces].sort((a, b) => {
        const pa = posMap.get(a.workspaceId) ?? Infinity;
        const pb = posMap.get(b.workspaceId) ?? Infinity;
        return pa - pb;
    });
}

function applyProjectOrder(
    projects: SidebarProject[],
    ids: string[],
): SidebarProject[] {
    const posMap = new Map(ids.map((id, i) => [id, i]));
    return [...projects].sort((a, b) => {
        const pa = posMap.get(a.id) ?? Infinity;
        const pb = posMap.get(b.id) ?? Infinity;
        return pa - pb;
    });
}

export function AppSidebar({
    companyId,
    companyName,
    isCompanyAdmin,
    workspaces,
    userEmail,
    initialProjectOrders = [],
    forceExpanded,
    onNavigate,
}: AppSidebarProps) {
    const pathname = usePathname();
    const params = useParams();
    const currentWorkspaceId = params?.workspaceId as string | undefined;
    const mobileNav = useMobileNav();

    const isDrawer = forceExpanded || mobileNav?.isDrawer;
    const handleNavigate = onNavigate ?? mobileNav?.close;

    const [collapsedState, setCollapsed] = useState(false);
    const collapsed = isDrawer ? false : collapsedState;
    const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState(false);

    // ── Ordered state ──────────────────────────────────────────────────────────
    const [orderedWorkspaces, setOrderedWorkspaces] =
        useState<SidebarWorkspace[]>(workspaces);
    const [projectsMap, setProjectsMap] = useState<
        Record<string, SidebarProject[]>
    >({});
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    // Tracks the workspaces prop to detect new workspaces added via router.refresh()
    const knownWorkspaceIdsRef = useRef(
        new Set(workspaces.map((ws) => ws.workspaceId)),
    );

    const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
        () => {
            const initial = currentWorkspaceId ?? workspaces[0]?.workspaceId;
            return new Set(initial ? [initial] : []);
        },
    );

    // ── Refs for stale-closure-safe DnD ───────────────────────────────────────
    const projectsMapRef = useRef(projectsMap);
    useEffect(() => {
        projectsMapRef.current = projectsMap;
    }, [projectsMap]);
    const preDragSnapshotRef = useRef<Record<string, SidebarProject[]>>({});

    // ── DnD ───────────────────────────────────────────────────────────────────
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );
    const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
    const dragCurrentWsRef = useRef<string | null>(null);

    // ── Avatar ────────────────────────────────────────────────────────────────
    useEffect(() => {
        getProfileAction().then(({ data }) => {
            if (data?.photoUrl) {
                const url = data.photoUrl.startsWith("http")
                    ? data.photoUrl
                    : `${process.env.NEXT_PUBLIC_API_URL}${data.photoUrl}`;
                setAvatarSrc(url);
            } else {
                gravatarUrl(userEmail, 40).then(setAvatarSrc);
            }
        });
    }, [userEmail]);

    // ── Apply localStorage order after hydration ─────────────────────────────
    // useEffect (not useLayoutEffect) to avoid hydration mismatch: the server
    // already applies the order via fetchAndApplySidebarOrder, so divergence
    // between localStorage and server order would cause Radix ID mismatches.
    useEffect(() => {
        const cached = readCache(companyId);
        if (!cached) return;
        setOrderedWorkspaces((prev) =>
            applyWorkspaceOrder(prev, cached.workspaceIds),
        );
    // companyId is stable on mount; workspaces initializes state only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Seed localStorage from server-provided order (first load, no cache) ───
    useEffect(() => {
        if (readCache(companyId)) return; // localStorage already has data
        if (initialProjectOrders.length === 0) return;
        // Build projectIds map from server-provided orders
        const projIds: Record<string, string[]> = {};
        for (const entry of initialProjectOrders) {
            if (!projIds[entry.workspaceId]) projIds[entry.workspaceId] = [];
            projIds[entry.workspaceId].push(entry.projectId);
        }
        // Sort each workspace's projects by position
        for (const wsId of Object.keys(projIds)) {
            const sorted = initialProjectOrders
                .filter((o) => o.workspaceId === wsId)
                .sort((a, b) => a.position - b.position)
                .map((o) => o.projectId);
            projIds[wsId] = sorted;
        }
        const wsIds = orderedWorkspaces.map((ws) => ws.workspaceId);
        writeCache(companyId, { workspaceIds: wsIds, projectIds: projIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Sync new workspaces from router.refresh() into state ──────────────────
    useEffect(() => {
        const newWorkspaces = workspaces.filter(
            (ws) => !knownWorkspaceIdsRef.current.has(ws.workspaceId),
        );
        if (newWorkspaces.length === 0) return;
        for (const ws of newWorkspaces) {
            knownWorkspaceIdsRef.current.add(ws.workspaceId);
        }
        setOrderedWorkspaces((prev) => [...prev, ...newWorkspaces]);
    }, [workspaces]);

    // ── Auto-expand current workspace ─────────────────────────────────────────
    useEffect(() => {
        if (currentWorkspaceId) {
            startTransition(() => {
                setExpandedWorkspaces((prev) => {
                    if (prev.has(currentWorkspaceId)) return prev;
                    return new Set([...prev, currentWorkspaceId]);
                });
            });
        }
    }, [currentWorkspaceId]);

    // ── Load projects when workspace expands ──────────────────────────────────
    useEffect(() => {
        for (const workspaceId of expandedWorkspaces) {
            if (projectsMap[workspaceId] !== undefined) continue;
            setLoadingMap((prev) => ({ ...prev, [workspaceId]: true }));
            getWorkspaceProjectsForSidebar(workspaceId).then((data) => {
                const cachedIds = readCache(companyId)?.projectIds[workspaceId];
                // Fallback to initialProjectOrders when no localStorage cache
                const serverIds = cachedIds ?? initialProjectOrders
                    .filter((o) => o.workspaceId === workspaceId)
                    .sort((a, b) => a.position - b.position)
                    .map((o) => o.projectId);
                const ordered = serverIds.length > 0 ? applyProjectOrder(data, serverIds) : data;
                setProjectsMap((prev) => ({ ...prev, [workspaceId]: ordered }));
                setLoadingMap((prev) => ({ ...prev, [workspaceId]: false }));
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expandedWorkspaces]);

    // ── projeto:updated event ─────────────────────────────────────────────────
    useEffect(() => {
        function handleProjetoUpdated(e: Event) {
            const { projectId, name, description, icon, iconColor } = (
                e as CustomEvent<{
                    projectId: string;
                    name: string;
                    description: string;
                    icon: string;
                    iconColor: string;
                }>
            ).detail;
            setProjectsMap((prev) => {
                const next = { ...prev };
                for (const wsId of Object.keys(next)) {
                    next[wsId] = next[wsId].map((p) =>
                        p.id === projectId
                            ? { ...p, name, description, icon, iconColor }
                            : p,
                    );
                }
                return next;
            });
        }
        window.addEventListener("projeto:updated", handleProjetoUpdated);
        return () =>
            window.removeEventListener("projeto:updated", handleProjetoUpdated);
    }, []);

    // ── workspace:created event ───────────────────────────────────────────────
    useEffect(() => {
        function handleWorkspaceCreated(e: Event) {
            const { workspaceId, workspaceName, companyId: eventCompanyId } = (
                e as CustomEvent<{
                    workspaceId: string;
                    workspaceName: string;
                    companyId: string;
                }>
            ).detail;

            if (eventCompanyId !== companyId) return;
            if (knownWorkspaceIdsRef.current.has(workspaceId)) return;

            const newWs: SidebarWorkspace = {
                workspaceId,
                workspaceName,
                companyId: eventCompanyId,
                role: "workspace_admin",
            };

            knownWorkspaceIdsRef.current.add(workspaceId);
            setOrderedWorkspaces((prev) => {
                const updated = [...prev, newWs];
                // Persist updated order to localStorage
                const cache = readCache(companyId) ?? {
                    workspaceIds: prev.map((ws) => ws.workspaceId),
                    projectIds: {},
                };
                cache.workspaceIds = updated.map((ws) => ws.workspaceId);
                writeCache(companyId, cache);
                return updated;
            });
        }
        window.addEventListener("workspace:created", handleWorkspaceCreated);
        return () =>
            window.removeEventListener(
                "workspace:created",
                handleWorkspaceCreated,
            );
    }, [companyId]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const toggleWorkspace = (workspaceId: string) => {
        setExpandedWorkspaces((prev) => {
            const next = new Set(prev);
            if (next.has(workspaceId)) {
                next.delete(workspaceId);
            } else {
                next.add(workspaceId);
            }
            return next;
        });
    };

    const handleProjectCreated = useCallback(
        (workspaceId: string) => {
            // Refresh projects for that workspace, apply existing cache order
            getWorkspaceProjectsForSidebar(workspaceId).then((data) => {
                setProjectsMap((prev) => {
                    const cachedIds = readCache(companyId)?.projectIds[workspaceId];
                    const ordered = cachedIds ? applyProjectOrder(data, cachedIds) : data;
                    return { ...prev, [workspaceId]: ordered };
                });
            });
        },
        [companyId],
    );

    // ── DnD handlers ──────────────────────────────────────────────────────────
    function handleDragStart({ active }: DragStartEvent) {
        const d = active.data.current;
        if (d?.type === "workspace") {
            setActiveDrag({ type: "workspace", id: active.id as string });
        } else if (d?.type === "project") {
            setActiveDrag({
                type: "project",
                id: active.id as string,
                originalWorkspaceId: d.workspaceId as string,
            });
            dragCurrentWsRef.current = d.workspaceId as string;
            // Snapshot state BEFORE the drag (for clean rollback)
            preDragSnapshotRef.current = { ...projectsMapRef.current };
        }
    }

    function handleDragOver({ active, over }: DragOverEvent) {
        if (!over || active.data.current?.type !== "project") return;

        const overData = over.data.current;
        const targetWsId =
            overData?.type === "project"
                ? (overData.workspaceId as string)
                : overData?.type === "workspace"
                  ? (over.id as string)
                  : null;

        if (!targetWsId || targetWsId === dragCurrentWsRef.current) return;

        const projectId = active.id as string;
        const currentWsId = dragCurrentWsRef.current!;
        dragCurrentWsRef.current = targetWsId;

        setProjectsMap((prev) => {
            const project = (prev[currentWsId] ?? []).find(
                (p) => p.id === projectId,
            );
            if (!project) return prev;
            return {
                ...prev,
                [currentWsId]: (prev[currentWsId] ?? []).filter(
                    (p) => p.id !== projectId,
                ),
                [targetWsId]: [...(prev[targetWsId] ?? []), project],
            };
        });

        // Ensure target workspace is expanded so the item is visible
        setExpandedWorkspaces((prev) => new Set([...prev, targetWsId]));
    }

    async function handleDragEnd({ active, over }: DragEndEvent) {
        const drag = activeDrag;
        setActiveDrag(null);
        // Capture BEFORE resetting — this is the workspace the project was in when dropped
        const lastWsId = dragCurrentWsRef.current;
        dragCurrentWsRef.current = null;

        if (!drag) return;

        // Case 1: reorder workspaces
        if (drag.type === "workspace") {
            if (!over || active.id === over.id) return;
            const oldIdx = orderedWorkspaces.findIndex(
                (ws) => ws.workspaceId === (active.id as string),
            );
            const newIdx = orderedWorkspaces.findIndex(
                (ws) => ws.workspaceId === (over.id as string),
            );
            if (oldIdx === -1 || newIdx === -1) return;
            const newOrder = arrayMove(orderedWorkspaces, oldIdx, newIdx);
            setOrderedWorkspaces(newOrder);
            const newIds = newOrder.map((ws) => ws.workspaceId);
            // Update localStorage
            const cache = readCache(companyId) ?? { workspaceIds: [], projectIds: {} };
            cache.workspaceIds = newIds;
            writeCache(companyId, cache);
            // Persist to DB (fire-and-forget)
            saveWorkspaceOrderAction(companyId, newIds);
            return;
        }

        // Cases 2 & 3: project drag
        // Use lastWsId (from ref) to detect cross-workspace — over.id may equal active.id
        // when the project lands on itself after handleDragOver moved it optimistically.
        const isCrossWs = lastWsId !== null && drag.originalWorkspaceId !== lastWsId;

        if (isCrossWs) {
            // Case 3: cross-workspace move (optimistic update already done in handleDragOver)
            // Use ref snapshot for rollback — avoids stale closure from before handleDragOver ran
            const finalWsId = lastWsId!;
            const preDragSnapshot = preDragSnapshotRef.current;
            moveProjectToWorkspaceAction(
                drag.originalWorkspaceId,
                drag.id,
                finalWsId,
            ).then((result) => {
                if (result?.error) {
                    // Revert to state BEFORE the drag started
                    setProjectsMap(preDragSnapshot);
                } else {
                    // Read from ref — guaranteed to reflect the post-handleDragOver state
                    const finalIds = (projectsMapRef.current[finalWsId] ?? []).map((p) => p.id);
                    // Update localStorage
                    const cache = readCache(companyId) ?? { workspaceIds: [], projectIds: {} };
                    cache.projectIds[finalWsId] = finalIds;
                    // Remove project from origin workspace cache
                    if (cache.projectIds[drag.originalWorkspaceId]) {
                        cache.projectIds[drag.originalWorkspaceId] =
                            cache.projectIds[drag.originalWorkspaceId].filter(
                                (id) => id !== drag.id,
                            );
                    }
                    writeCache(companyId, cache);
                    // Persist to DB (fire-and-forget)
                    saveProjectOrderAction(finalWsId, finalIds);
                }
            });
        } else {
            // Case 2: reorder within same workspace
            if (!over || active.id === over.id) return;
            const overData = over.data.current;
            const finalWsId =
                overData?.type === "project"
                    ? (overData.workspaceId as string)
                    : (over.id as string);
            const projects = projectsMap[finalWsId] ?? [];
            const oldIdx = projects.findIndex((p) => p.id === (active.id as string));
            const newIdx = projects.findIndex((p) => p.id === (over.id as string));
            if (oldIdx === -1 || newIdx === -1) return;
            const newOrder = arrayMove(projects, oldIdx, newIdx);
            setProjectsMap((prev) => ({ ...prev, [finalWsId]: newOrder }));
            const newIds = newOrder.map((p) => p.id);
            // Update localStorage
            const cache = readCache(companyId) ?? { workspaceIds: [], projectIds: {} };
            cache.projectIds[finalWsId] = newIds;
            writeCache(companyId, cache);
            // Persist to DB (fire-and-forget)
            saveProjectOrderAction(finalWsId, newIds);
        }
    }

    return (
        <aside
            className={cn(
                "h-screen sticky top-0 bg-sidebar border-r flex flex-col transition-[width] duration-300 ease-in-out",
                collapsed ? "w-14" : "w-60",
            )}
        >
            {/* Company header */}
            <div className="px-3 py-4 border-b flex items-center justify-between min-h-[60px]">
                {!collapsed && (
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                            Empresa
                        </p>
                        <p
                            className="text-sm font-semibold truncate leading-tight"
                            title={companyName}
                        >
                            {companyName}
                        </p>
                    </div>
                )}
                {!isDrawer && (
                    <button
                        onClick={() => setCollapsed((c) => !c)}
                        className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md
                         text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        aria-label={
                            collapsed ? "Expandir sidebar" : "Recolher sidebar"
                        }
                    >
                        {collapsed ? (
                            <PanelLeftOpen className="h-4 w-4" />
                        ) : (
                            <PanelLeftClose className="h-4 w-4" />
                        )}
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
                {/* Top-level links */}
                <Link
                    href={`/empresa/${companyId}/inicio`}
                    onClick={handleNavigate}
                    className={cn(
                        "flex items-center py-1.5 rounded-md text-sm transition-colors",
                        collapsed ? "justify-center px-0 mx-1" : "gap-2.5 px-2",
                        pathname === `/empresa/${companyId}/inicio`
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                >
                    <Home className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Atividades</span>}
                </Link>

                <Link
                    href={`/empresa/${companyId}/workspaces`}
                    onClick={handleNavigate}
                    className={cn(
                        "flex items-center py-1.5 rounded-md text-sm transition-colors",
                        collapsed ? "justify-center px-0 mx-1" : "gap-2.5 px-2",
                        pathname === `/empresa/${companyId}/workspaces`
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                >
                    <LayoutGrid className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Workspaces</span>}
                </Link>

                {isCompanyAdmin && (
                    <Link
                        href={`/empresa/${companyId}/membros`}
                        onClick={handleNavigate}
                        className={cn(
                            "flex items-center py-1.5 rounded-md text-sm transition-colors",
                            collapsed
                                ? "justify-center px-0 mx-1"
                                : "gap-2.5 px-2",
                            pathname.startsWith(`/empresa/${companyId}/membros`)
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                    >
                        <Users className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>Membros</span>}
                    </Link>
                )}

                {isCompanyAdmin && (
                    <Link
                        href={`/empresa/${companyId}/comunicado`}
                        onClick={handleNavigate}
                        className={cn(
                            "flex items-center py-1.5 rounded-md text-sm transition-colors",
                            collapsed
                                ? "justify-center px-0 mx-1"
                                : "gap-2.5 px-2",
                            pathname.startsWith(
                                `/empresa/${companyId}/comunicado`,
                            )
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                    >
                        <Megaphone className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>Comunicados</span>}
                    </Link>
                )}

                {isCompanyAdmin && (
                    <Link
                        href={`/empresa/${companyId}/atividades`}
                        onClick={handleNavigate}
                        className={cn(
                            "flex items-center py-1.5 rounded-md text-sm transition-colors",
                            collapsed
                                ? "justify-center px-0 mx-1"
                                : "gap-2.5 px-2",
                            pathname.startsWith(
                                `/empresa/${companyId}/atividades`,
                            )
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                    >
                        <Activity className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>Acompanhamento</span>}
                    </Link>
                )}

                {/* Workspaces section — hidden when collapsed */}
                {!collapsed && (
                    <>
                        <div className="pt-3 pb-1 flex items-center justify-between px-2">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Workspaces
                            </span>
                            {isCompanyAdmin && (
                                <CreateWorkspaceInlineTrigger
                                    companyId={companyId}
                                />
                            )}
                        </div>

                        {orderedWorkspaces.length === 0 ? (
                            <div className="px-2 py-3 text-center">
                                <p className="text-xs text-muted-foreground italic mb-2">
                                    Nenhum workspace ainda.
                                </p>
                                {isCompanyAdmin && (
                                    <CreateWorkspaceInlineTrigger
                                        companyId={companyId}
                                        variant="button"
                                    />
                                )}
                            </div>
                        ) : (
                            <DndContext
                                id="sidebar-dnd"
                                sensors={sensors}
                                collisionDetection={collisionDetection}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={orderedWorkspaces.map(
                                        (ws) => ws.workspaceId,
                                    )}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-0.5">
                                        {orderedWorkspaces.map((ws) => (
                                            <WorkspaceNavItem
                                                key={ws.workspaceId}
                                                workspace={ws}
                                                isExpanded={expandedWorkspaces.has(
                                                    ws.workspaceId,
                                                )}
                                                onToggle={toggleWorkspace}
                                                isAdmin={
                                                    isCompanyAdmin ||
                                                    ws.role === "workspace_admin"
                                                }
                                                projects={
                                                    projectsMap[
                                                        ws.workspaceId
                                                    ] ?? []
                                                }
                                                loadingProjects={
                                                    loadingMap[
                                                        ws.workspaceId
                                                    ] ?? false
                                                }
                                                onProjectCreated={
                                                    handleProjectCreated
                                                }
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                                <DragOverlay>
                                    {activeDrag?.type === "workspace" && (
                                        <div className="px-2 py-1.5 rounded-md bg-accent text-accent-foreground text-sm font-medium opacity-90 shadow-lg">
                                            {
                                                orderedWorkspaces.find(
                                                    (ws) =>
                                                        ws.workspaceId ===
                                                        activeDrag.id,
                                                )?.workspaceName
                                            }
                                        </div>
                                    )}
                                    {activeDrag?.type === "project" && (
                                        <div className="px-2 py-1.5 rounded-md bg-accent text-accent-foreground text-xs opacity-90 shadow-lg">
                                            Movendo projeto...
                                        </div>
                                    )}
                                </DragOverlay>
                            </DndContext>
                        )}
                    </>
                )}
            </nav>

            {/* Profile footer */}
            <div className="border-t">
                <Link
                    href="/perfil"
                    onClick={handleNavigate}
                    className={cn(
                        "w-full flex items-center px-3 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
                        collapsed ? "justify-center" : "gap-2.5",
                    )}
                >
                    <span
                        className="relative shrink-0 h-7 w-7 rounded-full overflow-hidden
                           bg-muted flex items-center justify-center text-xs font-medium"
                    >
                        {!avatarError && avatarSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={avatarSrc}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                                onError={() => setAvatarError(true)}
                            />
                        ) : (
                            <span className="uppercase leading-none">
                                {userEmail.charAt(0)}
                            </span>
                        )}
                    </span>
                    {!collapsed && (
                        <>
                            <span className="truncate text-xs font-medium flex-1">
                                {userEmail}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                                Perfil
                            </span>
                        </>
                    )}
                </Link>
            </div>
        </aside>
    );
}
