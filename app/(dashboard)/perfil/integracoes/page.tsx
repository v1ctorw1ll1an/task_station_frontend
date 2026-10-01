import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plug } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { GoogleCalendarCard } from '@/components/perfil/integracoes/google-calendar-card';

export default function IntegracoesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/perfil"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm font-medium">Integrações</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-muted p-2.5">
            <Plug className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Integrações</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Conecte o TaskDY a outros serviços que você usa
            </p>
          </div>
        </div>

        <Separator />

        {/* useSearchParams (retorno do OAuth) exige Suspense. */}
        <Suspense>
          <GoogleCalendarCard />
        </Suspense>
      </div>
    </div>
  );
}
