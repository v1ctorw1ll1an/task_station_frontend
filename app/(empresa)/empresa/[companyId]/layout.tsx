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

interface EmpresaLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}

export default async function EmpresaLayout({ children, params }: EmpresaLayoutProps) {
  const { companyId } = await params;
  const session = await getSession();

  if (!session) redirect('/login');
  if (session.user.mustResetPassword) redirect('/first-access');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const headers = { Authorization: `Bearer ${session.token}` };

  // Verify company access + get role
  const companiesRes = await fetch(`${apiUrl}/api/v1/me/empresas`, {
    headers,
    cache: 'no-store',
  });
  // Sessão derrubada sai pela rota que apaga o cookie; o resto cai no dashboard.
  await redirecionaSeSessaoInvalida(companiesRes);
  if (!companiesRes.ok) redirect('/dashboard');

  const companies: Array<{
    companyId: string;
    legalName: string;
    role: string;
    blocked?: boolean;
    mode?: 'ok' | 'read_only' | 'suspended';
    blockReason?: 'trial_ended' | 'subscription_expired' | 'admin_locked' | 'admin_suspended' | null;
    needsSubscription?: boolean;
    billingStatus?: string | null;
    trialEndsAt?: string | null;
  }> = await companiesRes.json();

  const company = companies.find((c) => c.companyId === companyId);
  if (!company) redirect('/dashboard');

  const isCompanyAdmin = company.role === 'admin';

  // Suspensão total (R44) é o único caso em que o app não aparece.
  if (company.mode === 'suspended') {
    return (
      <AccessBlockedScreen
        companyId={companyId}
        companyName={company.legalName}
        isAdmin={isCompanyAdmin}
        reason="admin_suspended"
        hasOtherCompanies={companies.length > 1}
      />
    );
  }

  // Somente leitura (R20): o app continua inteiro — consulta e apaga —, só não
  // cria nem altera. Quem garante isso é o backend; aqui é a explicação para o time.
  const readOnly = company.mode === 'read_only';
  const readOnlyReason =
    company.blockReason === 'trial_ended' || company.blockReason === 'admin_locked'
      ? company.blockReason
      : 'subscription_expired';

  // Fetch workspace list for sidebar tree
  let workspaces: SidebarWorkspace[] = [];
  if (isCompanyAdmin) {
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
    const myWsRes = await fetch(`${apiUrl}/api/v1/me/workspaces`, {
      headers,
      cache: 'no-store',
    });
    if (myWsRes.ok) {
      const data: Array<{ workspaceId: string; workspaceName: string; companyId: string; role: string }> =
        await myWsRes.json();
      workspaces = data
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
      sidebar={
        <AppSidebar
          companyId={companyId}
          companyName={company.legalName}
          isCompanyAdmin={isCompanyAdmin}
          workspaces={orderedWorkspaces}
          userEmail={session.user.email}
          initialProjectOrders={projectOrders}
        />
      }
      headerLeft={
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium truncate block">
          Painel da Empresa
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
      {!readOnly && company.needsSubscription && (
        <SubscribeBanner
          companyId={companyId}
          isAdmin={isCompanyAdmin}
          status={company.billingStatus ?? 'trial'}
          trialEndsAt={company.trialEndsAt ?? null}
        />
      )}
      {children}
      <TrackingWidget initialSessions={mySessions} />
      <StickyNotesManagerClient initialNotes={initialNotes} />
      <TourProvider companyId={companyId} />
    </SidebarShell>
    </BillingModeProvider>
  );
}
