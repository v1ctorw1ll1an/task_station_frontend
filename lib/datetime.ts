import { parseISO } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/** Timezone IANA do navegador (fallback America/Sao_Paulo em SSR). */
export const BROWSER_TZ =
  typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'America/Sao_Paulo';

/**
 * Combina data + hora no TZ informado e retorna ISO UTC.
 * Para all-day, usa 00:00 como wall-clock. Compartilhado por evento e task.
 */
export function combineDateAndTime(
  date: string,
  time: string,
  allDay: boolean,
  timezone: string,
): string {
  // Sem data não há instante a calcular — evita `RangeError: Invalid time value`
  // ao renderizar enquanto o campo está vazio.
  if (!date) return '';
  const t = allDay ? '00:00:00' : `${time || '00:00'}:00`;
  const d = fromZonedTime(`${date}T${t}`, timezone);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

/** Data (YYYY-MM-DD) de um ISO no TZ informado; '' se vazio/inválido. */
export function dateInTz(iso: string | null | undefined, timezone: string): string {
  if (!iso) return '';
  const d = parseISO(iso);
  return Number.isNaN(d.getTime()) ? '' : formatInTimeZone(d, timezone, 'yyyy-MM-dd');
}

/** Hora (HH:mm) de um ISO no TZ informado; '' se vazio/inválido. */
export function timeInTz(iso: string | null | undefined, timezone: string): string {
  if (!iso) return '';
  const d = parseISO(iso);
  return Number.isNaN(d.getTime()) ? '' : formatInTimeZone(d, timezone, 'HH:mm');
}

/**
 * Hora curta (HH:mm) da task no TZ dela para exibição/edição. Retorna '' quando
 * não há valor ou a hora é 00:00 — convenção: hora zerada = "sem horário"
 * (a task pode ser feita a qualquer momento), então a UI não mostra hora.
 */
export function formatTaskTime(
  iso: string | null | undefined,
  timezone: string,
): string {
  const t = timeInTz(iso, timezone);
  return t === '00:00' ? '' : t;
}
