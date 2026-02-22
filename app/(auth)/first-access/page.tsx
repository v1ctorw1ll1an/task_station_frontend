import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { MagicLinkFirstAccess } from '@/components/auth/magic-link-first-access';

interface FirstAccessPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function FirstAccessPage({ searchParams }: FirstAccessPageProps) {
  const { token } = await searchParams;

  // ── Fluxo 1: magic link (token na URL, usuário não autenticado) ──────────────
  if (token) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    let email: string | null = null;

    try {
      const res = await fetch(
        `${apiUrl}/api/v1/auth/first-access?token=${encodeURIComponent(token)}`,
        { cache: 'no-store' },
      );
      if (res.ok) {
        const body = (await res.json()) as { email: string };
        email = body.email;
      }
    } catch {
      // token inválido — cair no card de erro abaixo
    }

    if (!email) {
      return (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>
              Este link de acesso é inválido ou expirou. Solicite um novo link ao administrador.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Bem-vindo ao Task Station</CardTitle>
          <CardDescription>
            Informe seu nome completo e crie uma senha para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MagicLinkFirstAccess token={token} email={email} />
        </CardContent>
      </Card>
    );
  }

  // ── Fluxo 2: usuário autenticado com mustResetPassword ───────────────────────
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!session.user.mustResetPassword) {
    redirect('/dashboard');
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Bem-vindo ao Task Station</CardTitle>
        <CardDescription>
          Este é seu primeiro acesso. Informe seu nome completo e crie uma senha para continuar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm showNameField />
      </CardContent>
    </Card>
  );
}
