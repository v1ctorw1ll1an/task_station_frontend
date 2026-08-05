'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, AlertTriangle } from 'lucide-react';

function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  if (Number.isNaN(diff)) return null;
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

/**
 * Banner global de CTA para assinar — aparece abaixo do header em todas as telas
 * da empresa/workspace quando a assinatura ainda não é paga (trial ou carência).
 * Some sozinho na própria tela de cobrança. Admin vê o botão "Ver planos"; os
 * demais veem uma orientação. Quando o trial encerra / assinatura vence, o app
 * é substituído pela tela de paywall (access-blocked-screen), não por este banner.
 */
export function SubscribeBanner({
  companyId,
  isAdmin,
  status,
  trialEndsAt,
}: {
  companyId: string;
  isAdmin: boolean;
  status: string;
  trialEndsAt: string | null;
}) {
  const pathname = usePathname();
  // Já está na tela de planos → não repete o CTA.
  if (pathname?.endsWith('/cobranca')) return null;

  const pastDue = status === 'past_due';
  const days = status === 'trial' ? trialDaysLeft(trialEndsAt) : null;

  const message = pastDue ? (
    <>
      Pagamento pendente. Regularize para manter o acesso da empresa.
    </>
  ) : days != null ? (
    <>
      Você está no <strong>teste grátis</strong> —{' '}
      {days === 0 ? 'termina hoje' : `${days} dia${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`}.
      Assine para não perder o acesso.
    </>
  ) : (
    <>
      Você está no <strong>teste grátis</strong>. Assine para não perder o acesso.
    </>
  );

  const tone = pastDue
    ? 'bg-destructive/10 border-destructive/30 text-destructive'
    : 'bg-primary/10 border-primary/30 text-foreground';

  const Icon = pastDue ? AlertTriangle : Sparkles;

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b px-4 py-2 text-sm ${tone}`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${pastDue ? '' : 'text-primary'}`} />
      <span>{message}</span>
      {isAdmin ? (
        <Link
          href={`/empresa/${companyId}/cobranca`}
          className="font-medium underline underline-offset-4"
        >
          Ver planos
        </Link>
      ) : (
        <span className="text-muted-foreground">Peça ao administrador para assinar.</span>
      )}
    </div>
  );
}
