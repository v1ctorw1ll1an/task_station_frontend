'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/actions/logout.action';

/**
 * Onde cai quem ativou a conta mas ainda não está em nenhuma empresa. Antes era
 * um "Sem acesso — contate o administrador da plataforma" que não dizia o que
 * fazer nem com quem falar. O que destrava a pessoa é o e-mail dela na mão do
 * gerente, então é isso que a tela entrega: o endereço em destaque, copiável, e
 * o caminho exato que o gerente percorre.
 */
export function SemEmpresaOnboarding({ email }: { email: string }) {
  const [copiado, setCopiado] = useState(false);
  const [verificando, startVerificar] = useTransition();
  const router = useRouter();

  async function copiar() {
    try {
      await navigator.clipboard.writeText(email);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de clipboard: o e-mail continua visível e selecionável.
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Falta o convite da sua empresa</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sua conta está pronta. Agora peça ao seu gerente para te adicionar.
          </p>
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Envie este e-mail para ele
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm font-medium">
              {email}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copiar}
              aria-label="Copiar e-mail"
            >
              {copiado ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">O que o gerente precisa fazer</p>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Entrar no TaskDY como administrador da empresa</li>
            <li>
              Abrir <span className="font-medium text-foreground">Empresa → Membros</span>
            </li>
            <li>
              Clicar em <span className="font-medium text-foreground">Adicionar</span> e colar o seu
              e-mail
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Você recebe o convite por e-mail e entra com um clique. Dá para participar de mais de
            uma empresa — no login você escolhe qual usar.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={verificando}
            onClick={() => startVerificar(() => router.refresh())}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${verificando ? 'animate-spin' : ''}`} />
            {verificando ? 'Verificando...' : 'Já pediu? Verificar'}
          </Button>
          <form action={logoutAction}>
            <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground">
              Sair
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
