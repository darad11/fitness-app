import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, Card, PageHeader, Skeleton } from '@/shared/ui';
import { InvalidCredentialsError, SyncOfflineError } from '../data/remote';
import { useSyncView } from '../data/syncState';
import { LoginScreen } from './LoginScreen';
import { signIn, signOut, syncNow } from '../service/syncService';

/** Synchronisierung (D-269): anmelden, Stand ansehen, abgleichen, abmelden. */
export function SyncPage() {
  const rt = useDb();
  const fmt = useFormatters();
  const view = useSyncView();
  const navigate = useNavigate();
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

  const submit = (email: string, password: string) => {
    setBusy('signIn');
    setError(null);
    signIn(rt.db, email, password)
      .then(() => {
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
          <LoginScreen
            busy={busy === 'signIn'}
            error={
              error ?? (status?.lastError === 'SessionExpiredError' ? (errorText ?? null) : null)
            }
            onSubmit={submit}
            onLater={() => void navigate('/mehr')}
          />
        )}
      </div>
    </>
  );
}
