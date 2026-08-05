'use client';

import { forwardRef } from 'react';
import { Check, GraduationCap, Loader2, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PERMISSION_LABEL, TOUR_TOTAL, type TourStep } from '@/lib/tour/steps';

interface TourCardProps {
  step: TourStep;
  index: number;
  building: boolean;
  built: boolean;
  buildError: string | null;
  onBuild: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export const TourCard = forwardRef<HTMLDivElement, TourCardProps>(function TourCard(
  { step, index, building, built, buildError, onBuild, onNext, onPrev, onSkip },
  ref,
) {
  const primeiro = index === 0;
  const ultimo = index === TOUR_TOTAL - 1;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-titulo"
      aria-describedby="tour-corpo"
      tabIndex={-1}
      className="w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border bg-popover text-popover-foreground shadow-lg outline-none"
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          aria-hidden
        >
          <GraduationCap className="h-4 w-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 id="tour-titulo" className="text-sm leading-snug font-semibold">
            {step.title}
          </h2>
          {step.requires && (
            <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
              <Lock className="h-3 w-3" aria-hidden />
              {PERMISSION_LABEL[step.requires]}
            </Badge>
          )}
        </div>
      </div>

      <p id="tour-corpo" className="px-4 text-sm leading-relaxed text-muted-foreground">
        {step.body}
      </p>

      {step.build && (
        <div className="px-4 pt-3">
          {built ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-500">
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {step.build.done}
            </p>
          ) : (
            <Button size="sm" className="w-full gap-1.5" onClick={onBuild} disabled={building}>
              {building ? (
                <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
              )}
              {building ? 'Criando…' : step.build.label}
            </Button>
          )}
          {buildError && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {buildError}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 p-4 pt-3">
        <span className="text-xs text-muted-foreground tabular-nums">
          {index + 1} de {TOUR_TOTAL}
        </span>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={onSkip}>
            {ultimo ? 'Fechar' : 'Pular'}
          </Button>
          {!primeiro && (
            <Button variant="outline" size="sm" onClick={onPrev}>
              Voltar
            </Button>
          )}
          <Button size="sm" onClick={onNext}>
            {ultimo ? 'Concluir' : 'Avançar'}
          </Button>
        </div>
      </div>
    </div>
  );
});
