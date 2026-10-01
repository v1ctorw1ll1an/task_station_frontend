export interface GoogleCalendarSource {
  id: string;
  summary: string;
  accessRole: string;
  writable: boolean;
  isTaskdyCalendar: boolean;
  importEnabled: boolean;
}

export interface GoogleCalendarStatus {
  /** Integração ligada no servidor (feature flag + credenciais). */
  enabled: boolean;
  /** Usuário está na allowlist do teste fechado. */
  allowed: boolean;
  /** Tem ao menos uma empresa com plano elegível. */
  canConnect: boolean;
  connection: {
    status: 'active' | 'revoked' | 'error';
    googleEmail: string;
    lastSyncAt: string | null;
    lastError: string | null;
    connectedAt: string;
  } | null;
  calendars: GoogleCalendarSource[];
  companies: { companyId: string; name: string; status: string | null; eligible: boolean }[];
}
