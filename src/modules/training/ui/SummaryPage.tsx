import { CalendarDays, ChevronRight, ListChecks } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { latestBefore, useBodyWeights } from '@/modules/body';
import { useFormatters } from '@/modules/settings';
import { t } from '@/shared/i18n/de';
import { Badge, ButtonLink, Card, PageHeader, Skeleton, StatTile, TileIcon } from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';
import { estimateCalories } from '../calc/calories';
import { formatSetValues } from '../calc/fields';
import { formatClock } from '../calc/format';
import { compareWithPrevious } from '../calc/history';
import { dayNumber, isoWeekday, plannedFor } from '../calc/programProgress';
import { isNewRecord } from '../calc/records';
import { bestSet, liveExercises, sessionProgress, sessionVolume } from '../calc/session';
import { useCompletedSessions, useHistoryRows, useSession } from '../data/useSession';
import { useActiveProgram, useProgramById, type ActiveProgram } from './useActiveProgram';

/**
 * Abschluss nach dem Beenden (S-09, AK-TRN-19, AK-TRN-20; FORM D-315): „Training abgeschlossen“,
 * die Zeile „… Minuten, … Übungen, … Sätze. Das warst du.“ (D-318), Kacheln Dauer, Übungen und Sätze, Karte mit Gesamtvolumen und geschätzten Kalorien, Vergleich
 * und beste Sätze, „Details anzeigen“, die nächste Einheit des aktiven Programms und „Zur Übersicht“.
 */
export function SummaryPage() {
  const { id = '' } = useParams();
  const session = useSession(id);
  const fmt = useFormatters();
  const template = useProgramById(session?.program?.programId)?.program;
  const active = useActiveProgram();
  const sessions = useCompletedSessions();
  const rows = useHistoryRows();
  const weights = useBodyWeights();
  const today = useToday();
  if (session === undefined) {
    return (
      <div aria-busy="true" className="grid gap-stack">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (session?.status !== 'completed') {
    return (
      <>
        <PageHeader title={t.summary.title} />
        <p className="mb-6 text-muted">{t.session.notFound}</p>
        <ButtonLink to="/training">{t.training.title}</ButtonLink>
      </>
    );
  }
  const number = (value: number) => fmt.number(value, { maximumFractionDigits: 2 });
  const exercises = liveExercises(session);
  const progress = sessionProgress(session);
  const number_ =
    session.program && template
      ? dayNumber(template, session.program.weekIndex, session.program.dayIndex)
      : undefined;
  const total = template ? template.weeks.reduce((sum, week) => sum + week.days.length, 0) : 0;
  const subtitle =
    number_ !== undefined
      ? `${session.title} · ${t.programs.dayOf(number_, total)}`
      : session.title;
  const comparison = sessions ? compareWithPrevious(session, sessions) : null;
  const weight = weights ? latestBefore(weights, session.endedAt ?? session.startedAt) : undefined;
  const calories = weights ? estimateCalories(session, weight?.weightKg) : null;
  const signed = (value: number, format: (abs: number) => string) =>
    `${value > 0 ? '+' : value < 0 ? '−' : '±'}${format(Math.abs(value))}`;
  const next = active ? nextSession(active, today) : null;
  return (
    <>
      <PageHeader title={t.summary.title} subtitle={subtitle} />
      {/* Zeile aus der Mikrotext-Tabelle (F4, D-318); ohne erledigten Satz gibt es nichts zu sagen. */}
      {progress.done > 0 ? (
        <p className="-mt-2 mb-5 text-lg font-medium">
          {t.summary.doneLine(
            Math.floor((session.durationSec ?? 0) / 60),
            exercises.length,
            progress.done,
          )}
        </p>
      ) : null}
      <dl className="grid grid-cols-3 gap-stack">
        <StatTile label={t.summary.duration} value={formatClock(session.durationSec ?? 0)} />
        <StatTile label={t.summary.exercises} value={fmt.number(exercises.length)} />
        <StatTile label={t.summary.setsShort} value={fmt.number(progress.done)} />
      </dl>
      <Card className="mt-stack">
        <dl className="grid gap-4 sm:grid-cols-2">
          <StatTile
            tone="plain"
            label={t.summary.totalVolume}
            value={fmt.number(Math.round(sessionVolume(session)))}
            unit="kg"
            hint={t.summary.volumeHint}
          />
          <div className="min-w-0">
            <dt className="eyebrow text-muted">{t.summary.kcal}</dt>
            <dd className="mt-1">
              {calories ? (
                <>
                  <span className="text-2xl font-semibold">
                    {t.summary.kcalValue(fmt.number(calories.kcal))}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {t.summary.kcalEstimate}
                    {calories.uncountedMinutes > 0
                      ? ` · ${t.summary.kcalCardio(calories.uncountedMinutes)}`
                      : ''}
                  </span>
                </>
              ) : weights === undefined ? (
                '…'
              ) : (
                <span className="block text-sm text-muted">
                  {t.summary.kcalNone}{' '}
                  <Link to="/fortschritt/gewicht" className="font-semibold text-accent-ink">
                    {t.summary.kcalAdd}
                  </Link>
                </span>
              )}
            </dd>
          </div>
        </dl>
      </Card>
      {comparison ? (
        <Card title={t.summary.compareTitle} className="mt-stack">
          <p className="mb-3 text-sm text-muted">
            {t.summary.compareText(fmt.dayMonthYear(new Date(comparison.previous.endedAt ?? '')))}
          </p>
          <dl className="grid grid-cols-2 gap-3">
            <StatTile
              tone="plain"
              label={t.summary.compareVolume}
              value={signed(comparison.volumeDiffKg, (abs) => fmt.number(abs))}
              unit="kg"
            />
            <StatTile
              tone="plain"
              label={t.summary.compareSets}
              value={signed(comparison.doneSetsDiff, (abs) => fmt.number(abs))}
            />
          </dl>
        </Card>
      ) : null}
      <Card title={t.summary.best} className="mt-stack">
        <ul className="divide-y divide-line">
          {exercises.map((exercise) => {
            const best = bestSet(exercise);
            return (
              <li key={exercise.id} className="flex flex-wrap justify-between gap-2 py-3">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {exercise.nameSnapshot}
                  {best &&
                  rows &&
                  isNewRecord(
                    rows,
                    exercise.exerciseId,
                    exercise.trackingMode,
                    best.actual,
                    session.id,
                  ) ? (
                    <Badge tone="success">{t.progress.newRecord}</Badge>
                  ) : null}
                </span>
                <span className="text-muted">
                  {best
                    ? formatSetValues(
                        best.actual,
                        exercise.trackingMode,
                        exercise.distanceUnit,
                        number,
                      )
                    : t.summary.noBest}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
      <Link
        to={`/training/verlauf/${session.id}`}
        className="mt-stack flex min-h-14 items-center gap-3 rounded-card bg-surface px-card py-3 shadow-card hover:bg-surface-2"
      >
        <TileIcon icon={ListChecks} />
        <span className="min-w-0 flex-1 font-semibold">{t.summary.details}</span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-faint" />
      </Link>
      {next ? (
        <Card title={t.summary.nextTitle} titleStyle="label" className="mt-stack">
          <div className="flex items-center gap-3">
            <TileIcon icon={CalendarDays} />
            <div className="min-w-0">
              <p className="font-semibold">{next.name}</p>
              <p className="text-caption text-muted">
                {[next.date ? fmt.weekdayDayMonth(next.date) : null, next.detail]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>
        </Card>
      ) : null}
      <ButtonLink to="/heute" size="lg" className="mt-6 w-full md:w-auto">
        {t.summary.done}
      </ButtonLink>
    </>
  );
}

/**
 * Nächste Einheit des aktiven Programms: Name, Trainingstag und das Datum nur, wenn der Tag einen
 * Wochentag-Hinweis hat (AK-PRG-09); ohne Hinweis steht kein erfundenes Datum da.
 */
function nextSession(
  active: ActiveProgram,
  today: Date,
): { name: string; detail: string; date: Date | null } | null {
  const next = active.progress.next;
  if (!next) return null;
  const hint = active.template.weeks[next.weekIndex]?.days[next.dayIndex]?.weekdayHint;
  const planned = plannedFor(active.template, next, today);
  let date: Date | null = null;
  if (planned.kind === 'weekday') {
    const ahead = (planned.weekday - isoWeekday(today) + 7) % 7 || 7;
    date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + ahead, 12);
  } else if (hint !== undefined) {
    date = today;
  }
  return {
    name: next.name,
    detail: `${t.programs.dayOf(next.index + 1, active.progress.total)} · ${active.template.name}`,
    date,
  };
}
