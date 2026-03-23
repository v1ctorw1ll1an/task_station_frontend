'use client';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  function cycle() {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Alternar tema" disabled>
        <Monitor className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label="Alternar tema">
      {theme === 'light' ? (
        <Sun className="h-4 w-4" />
      ) : theme === 'dark' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Monitor className="h-4 w-4" />
      )}
    </Button>
  );
}
