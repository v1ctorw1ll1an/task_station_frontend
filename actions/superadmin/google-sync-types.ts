export type GoogleSyncDirection = 'both' | 'google_to_app' | 'app_to_google';

export interface GoogleSyncPanel {
  /** Integração ligada no servidor (feature flag + credenciais). */
  enabled: boolean;
  direction: GoogleSyncDirection;
  updatedAt: string | null;
  updatedBy: { id: string; name: string; email: string } | null;
  stats: { activeConnections: number; pendingJobs: number; failingJobs: number };
  /** Só na resposta da troca: conexões com resync completo agendado. */
  resyncQueued?: number;
}
