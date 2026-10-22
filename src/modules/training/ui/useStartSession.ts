import { useState } from 'react';
import { useNavigate } from 'react-router';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import type { StartInput } from '../calc/plan';

/** Kennzeichen in der Adresse des Players: leichtes Training nach einer Pause (D-319). */
export const LIGHT_QUERY = '?leicht=1';

/**
 * Startet eine Einheit und öffnet den Player; läuft schon eine, wird sie angeboten (AK-TRN-22).
 * `light`: aus dem Rückkehr-Flow (D-319); der Player zeigt dann „Weniger Sätze sind heute in
 * Ordnung.“ Plan und Sätze bleiben unverändert.
 */
export function useStartSession() {
  const rt = useDb();
  const navigate = useNavigate();
  const [error, setError] = useState<{ message: string; activeId?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const start = async (input: StartInput, options: { light?: boolean } = {}) => {
    setBusy(true);
    setError(null);
    // Dienst erst beim Start laden (D-307): er liegt sonst in der Startansicht.
    const service = await import('../service/sessionService');
    try {
      const session = await service.startSession(rt, input);
      void navigate(`/training/einheit/${session.id}${options.light ? LIGHT_QUERY : ''}`);
    } catch (caught) {
      if (caught instanceof service.ActiveSessionError) {
        setError({ message: t.training.activeExists, activeId: caught.sessionId });
      } else {
        void logError(rt.db, { area: 'training', error: caught, route: window.location.pathname });
        setError({ message: t.training.startFailed });
      }
    } finally {
      setBusy(false);
    }
  };
  return { start, error, busy };
}
