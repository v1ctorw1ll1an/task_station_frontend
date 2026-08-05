import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { NotificationSocketProvider } from '@/components/notifications/notification-socket-provider';
import { TrackingWidget } from '@/components/workspace/task-tracking/tracking-widget';
import { getMyActiveSessionsAction } from '@/actions/task-session/get-my-active-sessions.action';
import { SubscribeBanner } from '@/components/billing/subscribe-banner';

interface CompanyBilling {
  companyId: string;
  role: string;
  needsSubscription?: boolean;
  billingStatus?: string | null;
  trialEndsAt?: string | null;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.user.mustResetPassword) {
    redirect('/first-access');
  }

  const mySessions = await getMyActiveSessionsAction();

  // CTA de assinar: mostra a primeira empresa do usuário que ainda precisa de plano
  // (empresa recém-criada cai aqui logo após a ativação).
  let pending: CompanyBilling | null = null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const companiesRes = await fetch(`${apiUrl}/api/v1/me/empresas`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  });
  if (companiesRes.ok) {
    const companies: CompanyBilling[] = await companiesRes.json();
    // needsSubscription já é falso para empresa bloqueada (o paywall fica na tela da empresa).
    pending = companies.find((c) => c.needsSubscription) ?? null;
  }

  return (
    <>
      {session.token && <NotificationSocketProvider token={session.token} />}
      {pending && (
        <SubscribeBanner
          companyId={pending.companyId}
          isAdmin={pending.role === 'admin'}
          status={pending.billingStatus ?? 'trial'}
          trialEndsAt={pending.trialEndsAt ?? null}
        />
      )}
      {children}
      <TrackingWidget initialSessions={mySessions} />
    </>
  );
}
