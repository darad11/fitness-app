import { useId, useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, Card, PageHeader, Skeleton } from '@/shared/ui';
import { InvalidCredentialsError, SyncOfflineError } from '../data/remote';
import { useSyncView } from '../data/syncState';
import { signIn, signOut, syncNow } from '../service/syncService';

const INPUT = 'h-12 w-full rounded-input border border-line bg-surface px-3 text-base text-fg';

/** Synchronisierung (D-269): anmelden, Stand ansehen, abgleichen, abmelden. */
export function SyncPage() {
  const rt = useDb();
  const fmt = useFormatters();
  const view = useSyncView();
  const id = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'signIn' | 'sync' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ts = t.sync;

  const run = () => {
    setBusy('sync');
    setError(null);
    syncNow(rt)
      .catch(() => undefined)
      .finally(() => {
        setBusy(null);
      });
  };

  const submit = () => {
    setBusy('signIn');
    setError(null);
    signIn(rt.db, email, password)
      .then(() => {
        setPassword('');
        setBusy(null);
        run();
      })
      .catch((caught: unknown) => {
        setBusy(null);
        setError(
          caught instanceof InvalidCredentialsError
            ? ts.invalidCredentials
            : caught instanceof SyncOfflineError
              ? ts.offline
              : ts.failed,
        );
      });
  };

  const status = view?.status;
  const errorText = status?.lastError ? (ts.errors[status.lastError] ?? ts.errors.other) : null;

  return (
    <>
      <PageHeader title={ts.title} back={{ to: '/mehr', label: t.more.title }} />
      <div className="grid gap-4">
        <Card>
          <p>{ts.intro}</p>
          <p className="mt-2 text-sm text-muted">{ts.notSynced}</p>
        </Card>
        {view === undefined ? (
          <Skeleton className="h-40" />
        ) : view.auth ? (
          <Card title={ts.signedInAs(view.auth.email)}>
            <p role="status" aria-live="polite">
              {busy === 'sync'
                ? ts.syncing
                : status?.lastSyncAt
                  ? ts.lastSync(fmt.dateTimeShort(new Date(status.lastSyncAt)))
                  : ts.never}
            </p>
            {status?.lastSyncAt && status.pulled !== undefined && status.pushed !== undefined ? (
              <p className="mt-1 text-sm text-muted">
                {ts.lastResult(status.pulled, status.pushed)}
              </p>
            ) : null}
            {status?.conflicts ? (
              <p className="mt-2 text-sm">{ts.conflicts(status.conflicts)}</p>
            ) : null}
            {errorText ? <p className="mt-2 text-sm text-danger">{errorText}</p> : null}
            <p className="mt-3 text-sm text-muted">{ts.auto}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button disabled={busy !== null} onClick={run}>
                {ts.syncNow}
              </Button>
              <Button
                variant="secondary"
                disabled={busy !== null}
                onClick={() => void signOut(rt.db)}
              >
                {ts.signOut}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted">{ts.signOutHint}</p>
          </Card>
        ) : (
          <Card title={ts.signInTitle}>
            {errorText && status?.lastError === 'SessionExpiredError' ? (
              <p className="mb-3 text-sm text-danger">{errorText}</p>
            ) : null}
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
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
                  required
                  autoComplete="username"
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
                  required
                  autoComplete="current-password"
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
                {busy === 'signIn' ? ts.signingIn : ts.signIn}
              </Button>
            </form>
            <p className="mt-3 text-sm text-muted">{ts.accountHint}</p>
          </Card>
        )}
      </div>
    </>
  );
}
