import { ClipboardList, ListChecks, Play } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import {
  Button,
  ButtonLink,
  Card,
  LinkList,
  PageHeader,
  Skeleton,
  Toast,
  type LinkListItem,
} from '@/shared/ui';
import { useActiveSession } from '../data/useSession';
import { restoreSession } from '../service/sessionService';
import { useStartSession } from './useStartSession';

/**
 * Training (S-03). Einstiege erscheinen erst, wenn ihr Bereich fertig ist (AK-UX-01);
 * Programme mit nächstem Tag und Verlauf folgen mit den weiteren Arbeitspaketen.
 */
const ENTRIES: readonly LinkListItem[] = [
  { to: '/training/programme', label: t.training.programs, icon: ClipboardList },
  { to: '/uebungen', label: t.training.exercises, icon: ListChecks },
];

export function TrainingPage() {
  const active = useActiveSession();
  const fmt = useFormatters();
  const { start, error, busy } = useStartSession();
  const rt = useDb();
  const navigate = useNavigate();
  const location = useLocation();
  const discarded = (location.state as { discarded?: string } | null)?.discarded;
  const [undoVisible, setUndoVisible] = useState(true);

  return (
    <>
      <PageHeader title={t.training.title} />
      <div aria-busy={active === undefined} className="mb-6">
        {active === undefined ? (
          <Skeleton className="h-28" />
        ) : active ? (
          <Card title={t.training.running}>
            <p className="mb-4 text-muted">
              {t.training.runningSince(active.title, fmt.time(new Date(active.startedAt)))}
            </p>
            <ButtonLink to={`/training/einheit/${active.id}`}>
              <Play aria-hidden="true" className="size-5" />
              {t.training.resume}
            </ButtonLink>
          </Card>
        ) : (
          <Button
            disabled={busy}
            onClick={() => {
              void start({ source: 'free', title: t.training.freeTitle, exercises: [] });
            }}
          >
            <Play aria-hidden="true" className="size-5" />
            {t.training.startFree}
          </Button>
        )}
        {error ? (
          <p role="alert" className="mt-3 text-danger">
            {error.message}
          </p>
        ) : null}
      </div>
      <LinkList items={ENTRIES} />
      {discarded && undoVisible ? (
        <Toast
          message={t.session.discarded}
          durationMs={10_000}
          onTimeout={() => {
            setUndoVisible(false);
          }}
          action={
            <Button
              variant="quiet"
              onClick={() => {
                setUndoVisible(false);
                restoreSession(rt, discarded).then(
                  () => navigate(`/training/einheit/${discarded}`, { replace: true }),
                  (caught: unknown) => {
                    void logError(rt.db, { area: 'training', error: caught, route: '/training' });
                  },
                );
              }}
            >
              {t.session.undoDiscard}
            </Button>
          }
        />
      ) : null}
    </>
  );
}
