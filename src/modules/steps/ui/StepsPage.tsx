import { useId, useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { dayKey } from '@/shared/lib/time';
import { Button, Card, PageHeader, Skeleton } from '@/shared/ui';
import { useToday } from '@/shared/ui/useToday';
import { DashboardAuthError, DashboardOfflineError } from '../data/dashboardRemote';
import { useStepsView } from '../data/stepsState';
import { connectDashboard, disconnectDashboard, refreshSteps } from '../service/stepsService';

const INPUT = 'field w-full min-w-0';

/** Schritte aus dem Dashboard (D-277): verbinden, abholen, trennen. */
export function StepsPage() {
  const rt = useDb();
  const fmt = useFormatters();
  const now = useToday();
  const view = useStepsView();
  const id = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'connect' | 'refresh' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const year = Number(dayKey(now, fmt.timeZone).slice(0, 4));
  const ts = t.steps;

  const header = (
    <PageHeader
      title={ts.pageTitle}
      back={{ to: '/mehr/einstellungen', label: t.settings.title }}
    />
  );
  if (view === undefined) {
    return (
      <>
        {header}
        <div aria-busy="true">
          <Skeleton className="h-48" />
        </div>
      </>
    );
  }

  if (!view.email) {
    return (
      <>
        {header}
        <Card>
          <p className="text-muted">{ts.intro}</p>
          <form
            className="mt-4 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setBusy('connect');
              setError(null);
              connectDashboard(rt.db, email, password, year)
                .then(() => {
                  setPassword('');
                })
                .catch((caught: unknown) => {
                  setError(
                    caught instanceof DashboardAuthError
                      ? ts.invalidCredentials
                      : caught instanceof DashboardOfflineError
                        ? ts.offline
                        : ts.failed,
                  );
                })
                .finally(() => {
                  setBusy(null);
                });
            }}
          >
            <div>
              <label
                htmlFor={`${id}-email`}
                className="mb-2 block text-sm font-semibold text-muted"
              >
                {ts.email}
              </label>
              <input
                id={`${id}-email`}
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                className={INPUT}
              />
            </div>
            <div>
              <label
                htmlFor={`${id}-password`}
                className="mb-2 block text-sm font-semibold text-muted"
              >
                {ts.password}
              </label>
              <input
                id={`${id}-password`}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
                className={INPUT}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy !== null} className="justify-self-start">
              {busy === 'connect' ? ts.connecting : ts.connect}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted">{ts.privacy}</p>
        </Card>
      </>
    );
  }

  const fetchedAt = view.cache?.fetchedAt;
  const statusText =
    view.status.lastError === 'auth'
      ? ts.authExpired
      : view.status.lastError === 'offline'
        ? ts.offline
        : view.status.lastError
          ? ts.failed
          : null;

  return (
    <>
      {header}
      <Card title={ts.connectedAs(view.email)}>
        {fetchedAt ? (
          <p className="-mt-2 text-sm text-muted">
            {ts.lastFetched(fmt.dateTimeShort(new Date(fetchedAt)))}
          </p>
        ) : null}
        {view.cache && !view.cache.config ? (
          <p className="mt-2 text-sm text-muted">{ts.notSetUp}</p>
        ) : null}
        {statusText ? (
          <p role="status" className="mt-2 text-sm text-danger">
            {statusText}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={busy !== null}
            onClick={() => {
              setBusy('refresh');
              void refreshSteps(rt.db, year).finally(() => {
                setBusy(null);
              });
            }}
          >
            {busy === 'refresh' ? ts.refreshing : ts.refresh}
          </Button>
          <Button
            variant="quiet"
            disabled={busy !== null}
            onClick={() => {
              void disconnectDashboard(rt.db);
            }}
          >
            {ts.disconnect}
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted">{ts.disconnectHint}</p>
      </Card>
    </>
  );
}
