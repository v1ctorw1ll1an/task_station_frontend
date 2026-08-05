import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { redirecionaSeSessaoInvalida } from '@/lib/session-guard';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { SidebarShell } from '@/components/navigation/sidebar-shell';
import { EmpresaUserMenu } from '@/components/empresa/user-menu';
import { SidebarWorkspace } from '@/components/navigation/workspace-nav-item';
import { NotificationBellClient } from '@/components/notifications/notification-bell-client';
import { ThemeToggle } from '@/components/theme-toggle';
import { fetchAndApplySidebarOrder } from '@/lib/sidebar-order';
import { TrackingWidget } from '@/components/workspace/task-tracking/tracking-widget';
import { getMyActiveSessionsAction } from '@/actions/task-session/get-my-active-sessions.action';
import { StickyNotesButtonClient, StickyNotesManagerClient } from '@/components/sticky-notes/sticky-notes-client';
import { fetchStickyNotesAction } from '@/actions/sticky-notes/fetch-sticky-notes.action';
import { SubscribeBanner } from '@/components/billing/subscribe-banner';
import { AccessBlockedScreen } from '@/components/billing/access-blocked-screen';
import { BillingModeProvider } from '@/components/billing/billing-mode';
import { ReadOnlyBar } from '@/components/billing/read-only-bar';
import { TourProvider } from '@/components/tour/tour-provider';
import { TourButton } from '@/components/tour/tour-button';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { workspaceId } = await params;
  const session = await getSession();

  if (!session) redirect('/login');
  if (session.user.mustResetPassword) redirect('/first-access');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = { Authorization: `Bearer ${session.token}` };

  // Resolve workspace info (works for both workspace members and company admins)
  const wsInfoRes = await fetch(`${apiUrl}/api/v1/workspace/${workspaceId}`, {
    headers,
    cache: 'no-store',
  });
  // Sessão derrubada sai pela rota que apaga o cookie; o resto cai no dashboard.
  await redirecionaSeSessaoInvalida(wsInfoRes);
  if (!wsInfoRes.ok) redirect('/dashboard');
  const wsInfo: { id: string; companyId: string; isActive: boolean } = await wsInfoRes.json();
  const companyId = wsInfo.companyId;

  let companyName = '';
  let isCompanyAdmin = false;
  let companyMode: 'ok' | 'read_only' | 'suspended' = 'ok';
  let companyBlockReason:
    | 'trial_ended'
    | 'subscription_expired'
    | 'admin_locked'
    | 'admin_suspended'
    | null = null;
  let companyNeedsSubscription = false;
  let companyBillingStatus: string | null = null;
  let companyTrialEndsAt: string | null = null;
  let companiesCount = 0;
  let workspaces: SidebarWorkspace[] = [];

  const companiesRes = await fetch(`${apiUrl}/api/v1/me/empresas`, {
    headers,
    cache: 'no-store',
  });
  if (companiesRes.ok) {
    const companies: Array<{
      companyId: string;
      legalName: string;
      role: string;
      blocked?: boolean;
      mode?: 'ok' | 'read_only' | 'suspended';
      blockReason?:
        | 'trial_ended'
        | 'subscription_expired'
        | 'admin_locked'
        | 'admin_suspended'
        | null;
      needsSubscription?: boolean;
      billingStatus?: string | null;
      trialEndsAt?: string | null;
    }> = await companiesRes.json();
    companiesCount = companies.length;
    const company = companies.find((c) => c.companyId === companyId);
    if (company) {
      companyName = company.legalName;
      isCompanyAdmin = company.role === 'admin';
      companyMode = company.mode ?? 'ok';
      companyBlockReason = company.blockReason ?? null;
      companyNeedsSubscription = company.needsSubscription ?? false;
      companyBillingStatus = company.billingStatus ?? null;
      companyTrialEndsAt = company.trialEndsAt ?? null;
    }
  }

  // Suspensão total (R44) é o único caso em que o app não aparece.
  if (companyMode === 'suspended') {
    return (
      <AccessBlockedScreen
        companyId={companyId}
        companyName={companyName || undefined}
        isAdmin={isCompanyAdmin}
        reason="admin_suspended"
        hasOtherCompanies={companiesCount > 1}
      />
    );
  }

  // Somente leitura (R20): o workspace continua utilizável, sem criar/alterar.
  const readOnly = companyMode === 'read_only';
  const readOnlyReason =
    companyBlockReason === 'trial_ended' || companyBlockReason === 'admin_locked'
      ? companyBlockReason
      : 'subscription_expired';

  if (isCompanyAdmin) {
    // Company admins see all workspaces
    const wsRes = await fetch(
      `${apiUrl}/api/v1/empresa/${companyId}/workspaces?limit=100&page=1`,
      { headers, cache: 'no-store' },
    );
    if (wsRes.ok) {
      const data = await wsRes.json();
      workspaces = (data.data ?? []).map(
        (ws: { id: string; name: string; isActive: boolean }) => ({
          workspaceId: ws.id,
          workspaceName: ws.name,
          companyId,
          role: 'admin',
        }),
      );
    }
  } else {
    // Regular members only see workspaces they belong to
    const myWsRes = await fetch(`${apiUrl}/api/v1/me/workspaces`, {
      headers,
      cache: 'no-store',
    });
    if (myWsRes.ok) {
      const myWorkspaces: Array<{
        workspaceId: string;
        workspaceName: string;
        companyId: string;
        role: string;
      }> = await myWsRes.json();
      workspaces = myWorkspaces
        .filter((ws) => ws.companyId === companyId)
        .map((ws) => ({
          workspaceId: ws.workspaceId,
          workspaceName: ws.workspaceName,
          companyId,
          role: ws.role,
        }));
    }
  }

  // Pre-order workspaces and get project orders from server (eliminates flash)
  const { workspaces: orderedWorkspaces, projectOrders } =
    await fetchAndApplySidebarOrder(session.token, companyId, workspaces);

  const mySessions = await getMyActiveSessionsAction();
  const initialNotes = await fetchStickyNotesAction();

  return (
    <BillingModeProvider readOnly={readOnly} companyId={companyId}>
    <SidebarShell
      variant="full-height"
      sidebar={
        <AppSidebar
          companyId={companyId}
          companyName={companyName || 'Empresa'}
          isCompanyAdmin={isCompanyAdmin}
          workspaces={orderedWorkspaces}
          userEmail={session.user.email}
          initialProjectOrders={projectOrders}
        />
      }
      headerLeft={
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium truncate block">
          Painel do Workspace
        </span>
      }
      headerRight={
        <>
          <div className="hidden sm:flex"><ThemeToggle /></div>
          <StickyNotesButtonClient />
          <TourButton />
          <NotificationBellClient token={session.token} />
          <EmpresaUserMenu email={session.user.email} isSuperuser={session.user.isSuperuser} />
        </>
      }
    >
      {readOnly && (
        <ReadOnlyBar companyId={companyId} isAdmin={isCompanyAdmin} reason={readOnlyReason} />
      )}
      {!readOnly && companyNeedsSubscription && (
        <SubscribeBanner
          companyId={companyId}
          isAdmin={isCompanyAdmin}
          status={companyBillingStatus ?? 'trial'}
          trialEndsAt={companyTrialEndsAt}
        />
      )}
      {children}
      <TrackingWidget initialSessions={mySessions} />
      <StickyNotesManagerClient initialNotes={initialNotes} />
      <TourProvider companyId={companyId} workspaceId={workspaceId} />
    </SidebarShell>
    </BillingModeProvider>
  );
}
