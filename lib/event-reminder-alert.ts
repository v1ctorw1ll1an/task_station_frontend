/**
 * Helpers para tocar som e disparar notificação do navegador
 * em resposta a lembretes de eventos (NotificationType.EVENT_REMINDER).
 *
 * O som é gerado via Web Audio API (sem precisar de asset MP3) —
 * um "ding" curto de duas notas.
 */

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioCtx) return audioCtx;
  const Ctor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioCtx = new Ctor();
  return audioCtx;
}

export function playReminderSound(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  // Em alguns navegadores o contexto começa suspenso até o primeiro gesto.
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => undefined);
  }

  const now = ctx.currentTime;
  const tone = (freq: number, start: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.02);
  };
  // "Ding-dong" agradável: G5 → C6
  tone(784, 0, 0.18);
  tone(1046, 0.18, 0.28);
}

export function showBrowserReminderNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      tag: `event-reminder-${title}`,
      icon: '/favicon.ico',
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    // Auto-close depois de 10s
    setTimeout(() => n.close(), 10_000);
  } catch {
    // Ignora — alguns navegadores bloqueiam silenciosamente
  }
}
