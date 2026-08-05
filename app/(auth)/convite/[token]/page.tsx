import Link from 'next/link';
import Image from 'next/image';
import { Building2, MailX } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { logoutAction } from '@/actions/logout.action';
import { AceitarConviteButton } from '@/components/auth/aceitar-convite-button';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type ConviteStatus = 'valid' | 'expired' | 'revoked' | 'accepted' | 'not_found';

interface ConvitePreview {
  status: ConviteStatus;
  companyName: string | null;
  email: string | null;
}

const mensagemPorStatus: Record<Exclude<ConviteStatus, 'valid'>, string> = {
  expired: 'Este convite expirou. Peça um novo ao administrador da empresa.',
  revoked: 'Este convite foi cancelado. Peça um novo ao administrador da empresa.',
  accepted: 'Este convite já foi usado. Se a conta é sua, é só entrar.',
  not_found: 'Convite não encontrado. Confira se o link veio completo.',
};

/**
 * Tela de aceite. O convite é vinculado ao e-mail: quem abre precisa estar logado
 * com o endereço convidado, então repassar o link não dá acesso a terceiro — e a
 * tela precisa cobrir os três estados (deslogado, logado certo, logado errado).
 */
export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/convites/${encodeURIComponent(token)}`, {
    cache: 'no-store',
  });

  const convite: ConvitePreview = res.ok
    ? await res.json()
    : { status: 'not_found', companyName: null, email: null };

  if (convite.status !== 'valid') {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <MailX className="h-6 w-6 text-muted-foreground" />
            Convite indisponível
          </CardTitle>
          <CardDescription>{mensagemPorStatus[convite.status]}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Ir para o login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const session = await getSession();
  const companyName = convite.companyName ?? 'sua empresa';
  const proximoDestino = `/convite/${encodeURIComponent(token)}`;

  // Deslogado: entrar (ou criar conta) e voltar para cá.
  if (!session) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Image src="/taskDY/taskDY.png" alt="TaskDY" width={28} height={28} />
            Convite para {companyName}
          </CardTitle>
          <CardDescription>
            O convite é para <span className="font-medium">{convite.email}</span>. Entre com essa
            conta para aceitar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild className="w-full">
            <Link href={`/login?next=${encodeURIComponent(proximoDestino)}`}>Entrar</Link>
          </Button>
          {/* O botão "Ainda não tenho conta" apontava para /register?tab=funcionario,
              aba que deixou de existir. /register hoje cria empresa + trial, que não é
              o que um convidado quer — mandar para lá seria pior que não ter o botão.
              Volta quando o fluxo de entrada de funcionário for redefinido. */}
          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta? Peça ao administrador da empresa para criar o seu acesso.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Logado com outro e-mail: o convite não vale para esta conta.
  if (session.user.email.toLowerCase() !== convite.email?.toLowerCase()) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <MailX className="h-6 w-6 text-muted-foreground" />
            Conta diferente
          </CardTitle>
          <CardDescription>
            Este convite é para <span className="font-medium">{convite.email}</span>, mas você está
            conectado como <span className="font-medium">{session.user.email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="w-full">
              Sair e entrar com a conta certa
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Ainda precisa definir a senha antes de entrar em qualquer empresa.
  if (session.user.mustResetPassword) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            Ative sua conta primeiro
          </CardTitle>
          <CardDescription>
            Defina sua senha para poder entrar em {companyName}. O convite continua valendo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/first-access">Definir senha</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Image src="/taskDY/taskDY.png" alt="TaskDY" width={28} height={28} />
          Convite para {companyName}
        </CardTitle>
        <CardDescription>
          Você foi convidado como <span className="font-medium">{convite.email}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AceitarConviteButton token={token} companyName={companyName} />
      </CardContent>
    </Card>
  );
}
