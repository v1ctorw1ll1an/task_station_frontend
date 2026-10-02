import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  FolderKanban,
  KanbanSquare,
  ListChecks,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LEGAL_CONTACT_EMAIL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'TaskDY · Gestão de projetos e tarefas em Kanban',
  description:
    'O TaskDY organiza projetos e tarefas da sua empresa em quadros Kanban, com workspaces, agenda, controle de tempo e sincronização opcional com o Google Agenda.',
};

const RECURSOS = [
  {
    icon: KanbanSquare,
    titulo: 'Quadros Kanban',
    texto:
      'Organize as tarefas de cada projeto em colunas e acompanhe o andamento arrastando os cartões de "A fazer" até "Concluído".',
  },
  {
    icon: FolderKanban,
    titulo: 'Empresas, workspaces e projetos',
    texto:
      'Separe o trabalho por empresa, área e projeto, com permissões por papel — cada pessoa vê só o que lhe diz respeito.',
  },
  {
    icon: ListChecks,
    titulo: 'Tarefas completas',
    texto:
      'Prazos, prioridades, responsáveis, checklists, comentários, anexos e notas adesivas em um só lugar.',
  },
  {
    icon: CalendarDays,
    titulo: 'Agenda',
    texto:
      'Veja tarefas com prazo e eventos da equipe por dia, semana, mês ou ano, com convites e lembretes.',
  },
  {
    icon: Clock,
    titulo: 'Controle de tempo',
    texto:
      'Registre quanto tempo cada pessoa dedica às tarefas e acompanhe as atividades da equipe.',
  },
  {
    icon: Users,
    titulo: 'Colaboração',
    texto:
      'Convide membros da equipe e compartilhe tarefas com pessoas de fora por um link seguro.',
  },
];

// Página inicial pública: apresenta o produto (exigência da verificação de
// branding do Google OAuth) e leva para login/cadastro. Quem já tem sessão
// segue direto para o dashboard.
export default async function Home() {
  const session = await getSession();
  if (session && !session.user.mustResetPassword) {
    redirect('/dashboard');
  }

  const cadastroAberto = process.env.NEXT_PUBLIC_SIGNUP_ENABLED === 'true';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/taskDY/taskDY.png" alt="TaskDY" width={32} height={32} className="h-8 w-auto" />
            <span className="text-lg font-semibold tracking-tight">TaskDY</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
            {cadastroAberto && (
              <Button asChild size="sm">
                <Link href="/register">Criar conta</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Gestão de projetos e tarefas da sua empresa, em quadros Kanban
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            O TaskDY é uma plataforma online para equipes planejarem, distribuírem e acompanharem o
            trabalho: projetos organizados em quadros, tarefas com prazo e responsável, agenda
            compartilhada e controle do tempo dedicado a cada entrega.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {cadastroAberto && (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/register">Criar conta grátis</Link>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant={cadastroAberto ? 'outline' : 'default'}
              className="w-full sm:w-auto"
            >
              <Link href="/login">Já tenho conta — entrar</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">
              Tudo o que a equipe precisa para entregar
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {RECURSOS.map(({ icon: Icon, titulo, texto }) => (
                <div key={titulo} className="rounded-xl border bg-card p-6">
                  <Icon className="size-6 text-primary" aria-hidden />
                  <h3 className="mt-4 font-semibold">{titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="google-agenda" className="border-t">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Integração opcional com o Google Agenda
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Se quiser, cada usuário pode conectar a própria conta Google em{' '}
                <em>Perfil › Integrações</em>. O TaskDY cria na sua conta um calendário chamado
                &quot;TaskDY&quot; e mantém nele os seus eventos e tarefas com prazo, sincronizando
                nos dois sentidos. Você também pode importar eventos de outros calendários, somente
                para leitura, para vê-los na agenda do TaskDY.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-6 text-primary" aria-hidden />
                <h3 className="font-semibold">Como tratamos os seus dados do Google</h3>
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                <li>Usados exclusivamente para sincronizar a sua agenda entre o TaskDY e o Google.</li>
                <li>Não usamos para publicidade, não vendemos e não repassamos a terceiros.</li>
                <li>Tokens de acesso guardados criptografados; você pode desconectar quando quiser.</li>
              </ul>
              <Link
                href="/privacidade#google"
                className="mt-4 inline-block text-sm text-primary underline underline-offset-2"
              >
                Leia a Política de Privacidade
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>TaskDY · {new Date().getFullYear()}</span>
          <nav className="flex items-center gap-4">
            <Link href="/privacidade" className="transition-colors hover:text-foreground">
              Privacidade
            </Link>
            <Link href="/termos" className="transition-colors hover:text-foreground">
              Termos de uso
            </Link>
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="transition-colors hover:text-foreground">
              Contato
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
