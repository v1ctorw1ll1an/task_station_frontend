'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TourCard } from './tour-card';
import type { TourStep } from '@/lib/tour/steps';

interface TourSpotlightProps {
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

/** Folga entre o recorte e o elemento destacado. */
const RECORTE_PADDING = 8;
/** Distância do cartão até a borda do recorte. */
const GAP = 12;
/** Margem mínima em relação à viewport. */
const MARGEM = 12;
/**
 * Quanto esperar a âncora aparecer antes de desistir e centralizar o cartão.
 * Vale só para passo que declara âncora: o elemento pode estar a caminho (rota
 * trocando, dados carregando). Passo sem âncora não espera nada.
 */
const TIMEOUT_ANCORA_MS = 1500;

interface Caixa {
  top: number;
  left: number;
  width: number;
  height: number;
}

function mesmaCaixa(a: Caixa | null, b: Caixa | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/**
 * Overlay do tutorial: escurece a tela, recorta o elemento do passo e posiciona o
 * cartão perto dele.
 *
 * **O elemento destacado continua clicável.** O tutorial manda o usuário criar o
 * workspace de verdade, então o bloqueio de cliques é feito por quatro faixas em
 * volta do recorte, não por uma camada por cima de tudo — o buraco no meio é o
 * ponto inteiro do exercício.
 *
 * A posição é lida num loop de `requestAnimationFrame` em vez de listeners de
 * scroll/resize porque o alvo também se move por causas que não emitem evento:
 * sidebar abrindo, imagem carregando, dialog empurrando layout. O loop só chama
 * `setState` quando a caixa muda de fato, então não gera re-render à toa.
 *
 * Este componente é remontado a cada passo (o provider usa `key`), então não
 * precisa zerar estado ao trocar de passo.
 */
export function TourSpotlight({
  step,
  index,
  building,
  built,
  buildError,
  onBuild,
  onNext,
  onPrev,
  onSkip,
}: TourSpotlightProps) {
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  const [posicao, setPosicao] = useState<{ top: number; left: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const caixaRef = useRef<Caixa | null>(null);

  const posicionarCartao = useCallback((alvo: Caixa | null) => {
    const card = cardRef.current;
    if (!card) return;
    const cardW = card.offsetWidth;
    const cardH = card.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!alvo) {
      setPosicao({
        top: Math.max(MARGEM, (vh - cardH) / 2),
        left: Math.max(MARGEM, (vw - cardW) / 2),
      });
      return;
    }

    const abaixo = alvo.top + alvo.height + RECORTE_PADDING + GAP;
    const acima = alvo.top - RECORTE_PADDING - GAP - cardH;

    let top: number;
    if (abaixo + cardH <= vh - MARGEM) top = abaixo;
    else if (acima >= MARGEM) top = acima;
    else top = Math.max(MARGEM, Math.min(vh - cardH - MARGEM, alvo.top));

    // Ao lado, quando o alvo é estreito e alto (itens da barra lateral), evita
    // cobrir justamente o que está sendo explicado.
    const preferirLado = alvo.width < vw * 0.25 && alvo.left < vw * 0.35;
    const left = preferirLado
      ? Math.min(vw - cardW - MARGEM, alvo.left + alvo.width + RECORTE_PADDING + GAP)
      : Math.max(
          MARGEM,
          Math.min(vw - cardW - MARGEM, alvo.left + alvo.width / 2 - cardW / 2),
        );

    setPosicao({ top, left: Math.max(MARGEM, left) });
  }, []);

  // Procura a âncora, rola até ela e acompanha a posição enquanto o passo dura.
  useEffect(() => {
    let raf = 0;
    let cancelado = false;
    let jaRolou = false;
    const inicio = performance.now();
    const seletor = step.anchor ? `[data-tour="${step.anchor}"]` : null;
    const espera = seletor ? TIMEOUT_ANCORA_MS : 0;
    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = () => {
      if (cancelado) return;

      const el = seletor ? document.querySelector<HTMLElement>(seletor) : null;

      if (el) {
        if (!jaRolou) {
          jaRolou = true;
          el.scrollIntoView({
            block: 'center',
            inline: 'nearest',
            behavior: semMovimento ? 'auto' : 'smooth',
          });
        }
        const r = el.getBoundingClientRect();
        const nova: Caixa = { top: r.top, left: r.left, width: r.width, height: r.height };
        // Elemento existe mas está colapsado (um pai com display:none, por exemplo):
        // trata como ausente para não desenhar um recorte de 0×0.
        const alvo = nova.width > 0 && nova.height > 0 ? nova : null;
        if (!mesmaCaixa(caixaRef.current, alvo)) {
          caixaRef.current = alvo;
          setCaixa(alvo);
        }
        posicionarCartao(alvo);
      } else if (performance.now() - inicio >= espera) {
        // Desistiu: passo sem âncora, sem permissão para ver o botão, ou nada
        // criado ainda.
        if (caixaRef.current !== null) {
          caixaRef.current = null;
          setCaixa(null);
        }
        posicionarCartao(null);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelado = true;
      cancelAnimationFrame(raf);
    };
  }, [step.anchor, posicionarCartao]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onNext, onPrev, onSkip]);

  // Só renderiza no cliente: o tour nunca está ativo no primeiro render.
  if (typeof document === 'undefined') return null;

  const buraco = caixa && {
    top: caixa.top - RECORTE_PADDING,
    left: caixa.left - RECORTE_PADDING,
    width: caixa.width + RECORTE_PADDING * 2,
    height: caixa.height + RECORTE_PADDING * 2,
  };

  return createPortal(
    <>
      {/* Bloqueio de cliques: quatro faixas ao redor do recorte, deixando o alvo
          acessível. Sem âncora, cobre a tela inteira. */}
      {buraco ? (
        <>
          <div className="fixed left-0 right-0 top-0 z-[190]" style={{ height: Math.max(0, buraco.top) }} />
          <div className="fixed left-0 right-0 bottom-0 z-[190]" style={{ top: buraco.top + buraco.height }} />
          <div
            className="fixed left-0 z-[190]"
            style={{ top: buraco.top, height: buraco.height, width: Math.max(0, buraco.left) }}
          />
          <div
            className="fixed right-0 z-[190]"
            style={{ top: buraco.top, height: buraco.height, left: buraco.left + buraco.width }}
          />
        </>
      ) : (
        <div className="fixed inset-0 z-[190]" />
      )}

      {buraco ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[200] rounded-lg ring-2 ring-primary motion-safe:transition-all motion-safe:duration-200"
          style={{ ...buraco, boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.6)' }}
        />
      ) : (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[200] bg-black/60" />
      )}

      <div
        className="fixed z-[210] motion-safe:transition-all motion-safe:duration-200"
        style={{
          top: posicao?.top ?? -9999,
          left: posicao?.left ?? -9999,
          visibility: posicao ? 'visible' : 'hidden',
        }}
      >
        <TourCard
          ref={cardRef}
          step={step}
          index={index}
          building={building}
          built={built}
          buildError={buildError}
          onBuild={onBuild}
          onNext={onNext}
          onPrev={onPrev}
          onSkip={onSkip}
        />
      </div>
    </>,
    document.body,
  );
}
