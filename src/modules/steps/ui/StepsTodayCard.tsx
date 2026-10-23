import { ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { dayKey } from '@/shared/lib/time';
import { Card, Meter } from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';
import { stepsSummary } from '../calc/stepStats';
import { getStepsCache, useStepsView } from '../data/stepsState';
import { refreshSteps } from '../service/stepsService';

/** Neu abholen, wenn der letzte Stand älter ist als zwei Minuten. */
const FRESH_MS = 120_000;

/**
 * Schritte-Karte auf „Heute“ (D-277), wie die Karte „Steps“ im Home des Dashboards: Schritte
 * heute, Tagesziel, „noch …“, Balken und Jahresstand. Holt beim Öffnen und bei Rückkehr in die
 * App neu ab; ohne Netz der letzte Stand mit Uhrzeit.
 */
export function StepsTodayCard() {
  const rt = useDb();
  const fmt = useFormatters();
  const now = useToday();
  const view = useStepsView();
  const connected = Boolean(view?.email);
  const year = Number(dayKey(now, fmt.timeZone).slice(0, 4));

  useEffect(() => {
    if (!connected) return;
    const update = () => {
      if (document.hidden) return;
      void (async () => {
        const cache = await getStepsCache(rt.db);
        if (!cache || Date.now() - cache.fetchedAt > FRESH_MS || cache.year !== year) {
          await refreshSteps(rt.db, year);
        }
      })();
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => {
      document.removeEventListener('visibilitychange', update);
    };
  }, [connected, rt.db, year]);

  if (view === undefined) return null;
  const steps = (n: number | null) => (n === null ? '–' : fmt.number(n));

  if (!view.email) {
    return (
      <Card title={t.steps.title} titleStyle="label">
        <p className="text-muted">{t.steps.connectHint}</p>
        <Link
          to="/mehr/schritte"
          className="mt-3 inline-flex min-h-11 items-center gap-1 font-semibold text-accent-ink"
        >
          {t.steps.connectLink}
          <ChevronRight aria-hidden="true" className="size-5" />
        </Link>
      </Card>
    );
  }

  const cache = view.cache;
  const todayKey = dayKey(now, fmt.timeZone);
  const summary =
    cache?.config && cache.year === year
      ? stepsSummary(cache.config, cache.entries, todayKey)
      : null;
  const stale =
    view.status.lastError && cache
      ? t.steps.stale(fmt.dateTimeShort(new Date(cache.fetchedAt)))
      : null;
  const problem =
    view.status.lastError === 'auth'
      ? t.steps.authExpired
      : view.status.lastError && !cache
        ? t.steps.offline
        : null;

  return (
    <Card
      title={t.steps.title}
      titleStyle="label"
      action={
        summary?.target != null ? (
          <span className="text-sm text-muted tabular-nums">
            {t.steps.target(steps(summary.target))}
          </span>
        ) : undefined
      }
    >
      {problem ? <p className="mb-2 text-sm text-danger">{problem}</p> : null}
      {cache && !cache.config ? <p className="text-muted">{t.steps.notSetUp}</p> : null}
      {summary ? (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-value font-semibold tabular-nums">
              {steps(summary.todaySteps)}
              <span className="text-base font-medium tracking-normal text-muted">
                {` ${t.steps.unit}`}
              </span>
            </p>
            <p className="text-muted tabular-nums">
              {summary.todaySteps === null
                ? t.steps.notLogged
                : summary.remaining === 0
                  ? t.steps.targetReached
                  : summary.remaining !== null
                    ? t.steps.toGo(steps(summary.remaining))
                    : ''}
            </p>
          </div>
          {summary.percent !== null ? (
            <Meter className="mt-3" label={t.steps.meterLabel} value={summary.percent / 100} />
          ) : null}
          <p className="mt-2 text-sm text-muted tabular-nums">
            {t.steps.year(String(summary.yearPercent), steps(summary.ytd), steps(summary.goal))}
            {stale ? ` · ${stale}` : ''}
          </p>
        </>
      ) : null}
    </Card>
  );
}
