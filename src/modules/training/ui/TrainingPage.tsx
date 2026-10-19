import { ClipboardList, History, ListChecks, PencilLine, Play } from 'lucide-react';
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
import { ActiveProgramCard } from './ActiveProgramCard';
import { useActiveProgram } from './useActiveProgram';
import { useStartSession } from './useStartSession';

/**
 * Training (S-03): laufende Einheit, sonst das aktive Programm mit dem nächsten Tag (TP-21),
 * sonst freies Training. Einstiege erscheinen erst, wenn ihr Bereich fertig ist (AK-UX-01).
 */
const ENTRIES: readonly LinkListItem[] = [
  {
    to: '/training/programme',
    label: t.training.programs,
    icon: ClipboardList,
    description: t.training.programsHint,
  },
  {
    to: '/training/nachtragen',
    label: t.log.title,
    icon: PencilLine,
    description: t.log.hint,
  },
  {
    to: '/training/verlauf',
    label: t.history.title,
    icon: History,
    description: t.training.historyHint,
  },
  {
    to: '/uebungen',
    label: t.training.exercises,
    icon: ListChecks,
    description: t.training.exercisesHint,
  },
];

export function TrainingPage() {
  const active = useActiveSession();
  const program = useActiveProgram();
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
      <div aria-busy={active === undefined || program === undefined} className="mb-4">
        {active === undefined || program === undefined ? (
          <Skeleton className="h-40" />
        ) : active ? (
          <Card tone="ink" eyebrow={t.training.running} title={active.title}>
            <p className="-mt-2 text-on-ink-muted">
              {t.training.since(fmt.time(new Date(active.startedAt)))}
            </p>
            <ButtonLink to={`/training/einheit/${active.id}`} variant="onInk" className="mt-5">
              <Play aria-hidden="true" className="size-5" />
              {t.training.resume}
            </ButtonLink>
          </Card>
        ) : program ? (
          <ActiveProgramCard
            program={program}
            eyebrow={t.training.activeProgram}
            busy={busy}
            onStart={(input) => {
              void start(input);
            }}
          >
            <Button
              variant="quiet"
              className="text-on-ink"
              disabled={busy}
              onClick={() => {
                void start({ source: 'free', title: t.training.freeTitle, exercises: [] });
              }}
            >
              {t.training.startFree}
            </Button>
          </ActiveProgramCard>
        ) : (
          <Card tone="ink" eyebrow={t.training.freeEyebrow} title={t.training.freeTitle}>
            <p className="-mt-2 max-w-md text-on-ink-muted">{t.training.freeHint}</p>
            <Button
              variant="onInk"
              className="mt-5"
              disabled={busy}
              onClick={() => {
                void start({ source: 'free', title: t.training.freeTitle, exercises: [] });
              }}
            >
              <Play aria-hidden="true" className="size-5" />
              {t.training.startFree}
            </Button>
          </Card>
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
              variant="onInk"
              size="sm"
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
