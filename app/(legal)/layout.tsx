import Link from 'next/link';
import Image from 'next/image';

// Páginas públicas (sem sessão): exigidas pelo Google na tela de consentimento OAuth.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/login" className="flex items-center gap-2">
            <Image src="/taskDY/taskDY.png" alt="TaskDY" width={28} height={28} className="h-7 w-auto" />
            <span className="text-sm font-semibold tracking-tight">TaskDY</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacidade" className="transition-colors hover:text-foreground">
              Privacidade
            </Link>
            <Link href="/termos" className="transition-colors hover:text-foreground">
              Termos de uso
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
      <footer className="border-t">
        <p className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-muted-foreground">
          TaskDY · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
