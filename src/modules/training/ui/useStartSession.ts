import { useState } from 'react';
import { useNavigate } from 'react-router';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { ActiveSessionError, startSession, type StartInput } from '../service/sessionService';

/** Startet eine Einheit und öffnet den Player; läuft schon eine, wird sie angeboten (AK-TRN-22). */
export function useStartSession() {
  const rt = useDb();
  const navigate = useNavigate();
  const [error, setError] = useState<{ message: string; activeId?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const start = async (input: StartInput) => {
    setBusy(true);
    setError(null);
    try {
      const session = await startSession(rt, input);
      void navigate(`/training/einheit/${session.id}`);
    } catch (caught) {
      if (caught instanceof ActiveSessionError) {
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
