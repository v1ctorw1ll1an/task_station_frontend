import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Lock } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { CobrancaPanel } from '@/components/empresa/cobranca/cobranca-panel';
import { suporteConfig } from '@/lib/suporte';
import { EmpresaUserMenu } from '@/components/empresa/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';

type BlockReason = 'trial_ended' | 'subscription_expired' | 'admin_suspended';

/**
 * Tela cheia de bloqueio (paywall). Substitui todo o app quando a empresa está
 * bloqueada — trial encerrado ou assinatura vencida. Admin vê os planos (variante
 * enxuta: sem status de plano/assentos; histórico só se houver cobranças) para
 * regularizar na hora; demais veem uma orientação. O app não é renderizado por
 * baixo, então não há como burlar removendo overlay.
 */
export async function AccessBlockedScreen({
  companyId,
  companyName,
  isAdmin,
  reason,
  hasOtherCompanies = false,
}: {
  companyId: string;
  companyName?: string;
  isAdmin: boolean;
  reason: BlockReason;
  /** Só mostra "Trocar de empresa" se o usuário tiver outra empresa. */
  hasOtherCompanies?: boolean;
}) {
  const session = await getSession();
  const trial = reason === 'trial_ended';
  // Trava administrativa não se resolve pagando — não adianta oferecer plano.
  const suspenso = reason === 'admin_suspended';
  const title = suspenso
    ? 'Acesso suspenso'
    : trial
      ? 'Seu teste grátis terminou'
      : 'Sua assinatura venceu';
  const subtitle = suspenso
    ? 'O acesso desta empresa foi suspenso pela administração do TaskDY. Fale com o suporte para regularizar — seus dados continuam salvos.'
    : trial
      ? 'Escolha um plano abaixo para voltar a usar o TaskDY. Seus dados continuam salvos.'
      : 'Regularize a cobrança para reativar o acesso da empresa. Seus dados continuam salvos.';

  let status: unknown = null;
  let charges: unknown[] = [];
  if (isAdmin && session && !suspenso) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const authHeader = { Authorization: `Bearer ${session.token}` };
    const [statusRes, histRes] = await Promise.all([
      fetch(`${apiUrl}/api/v1/billing/empresa/${companyId}`, { headers: authHeader, cache: 'no-store' }),
      fetch(`${apiUrl}/api/v1/billing/empresa/${companyId}/historico?limit=50`, {
        headers: authHeader,
        cache: 'no-store',
      }),
    ]);
    if (statusRes.ok) status = await statusRes.json();
    if (histRes.ok) charges = (await histRes.json()).data ?? [];
  }

  // getStatus concilia pagamentos pendentes no Asaas (rede de segurança p/ webhook
  // perdido). Se a empresa destravou, manda para a tela principal — o cache do gate
  // já foi invalidado, então o layout re-renderiza sem o paywall.
  if (status) {
    const s = status as { status: string; trialEndsAt: string | null };
    const stillBlocked =
      ['readonly', 'canceled'].includes(s.status) ||
      (s.status === 'trial' && s.trialEndsAt != null && new Date(s.trialEndsAt) < new Date());
    if (!stillBlocked) redirect(`/empresa/${companyId}/inicio`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-medium">
          <Image src="/taskDY/taskDY.png" alt="TaskDY" width={24} height={24} />
          TaskDY
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session && (
            <EmpresaUserMenu email={session.user.email} isSuperuser={session.user.isSuperuser} />
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-5">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {companyName ? <span className="font-medium">{companyName}</span> : 'Esta empresa'} —{' '}
              {subtitle}
            </p>
            {hasOtherCompanies && (
              <Link
                href="/dashboard"
                className="inline-block pt-1 text-sm text-muted-foreground underline underline-offset-4"
              >
                Trocar de empresa
              </Link>
            )}
          </div>
        </div>

        {suspenso ? (
          <p className="text-sm text-muted-foreground">
            Se você acredita que isso é um engano, entre em contato com o suporte informando o nome
            da empresa.
          </p>
        ) : isAdmin && status ? (
          <CobrancaPanel
            companyId={companyId}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status={status as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            charges={charges as any}
            variant="paywall"
            suporte={suporteConfig()}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Peça ao administrador da empresa para regularizar a cobrança e reativar o acesso.
          </p>
        )}
      </main>
    </div>
  );
}
