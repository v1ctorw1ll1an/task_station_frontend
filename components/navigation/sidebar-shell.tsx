'use client';

import { createContext, useContext, useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

const MobileNavContext = createContext<{ close: () => void; isDrawer: boolean } | null>(null);

/** Returns drawer helpers when rendered inside the mobile Sheet; null on desktop. */
export function useMobileNav() {
  return useContext(MobileNavContext);
}

interface SidebarShellProps {
  sidebar: React.ReactNode;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'full-height' | 'min-height';
}

export function SidebarShell({
  sidebar,
  headerLeft,
  headerRight,
  children,
  variant = 'min-height',
}: SidebarShellProps) {
  const [open, setOpen] = useState(false);

  const isFullHeight = variant === 'full-height';

  return (
    <div
      className={
        isFullHeight
          ? 'flex h-dvh overflow-hidden'
          : 'flex min-h-screen'
      }
    >
      {/* Desktop sidebar — hidden on mobile via CSS, stable across SSR/hydration */}
      <div className="hidden md:contents">
        {sidebar}
      </div>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-60 p-0 [&>button]:hidden" aria-describedby={undefined}>
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <MobileNavContext.Provider value={{ close: () => setOpen(false), isDrawer: true }}>
            {sidebar}
          </MobileNavContext.Provider>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center gap-2 px-3 md:px-6 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Hamburger — visible only on mobile via CSS */}
            <button
              onClick={() => setOpen(true)}
              className="h-8 w-8 flex shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 truncate">{headerLeft}</div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {headerRight}
          </div>
        </header>
        <main
          className={
            isFullHeight
              ? 'flex-1 overflow-y-auto p-3 md:p-6'
              : 'flex-1 p-3 md:p-6'
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
