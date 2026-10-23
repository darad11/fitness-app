import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useFormatters } from '@/modules/settings';
import { useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { tSync } from '@/shared/i18n/de-sync';
import { Button, Card, PageHeader, Skeleton } from '@/shared/ui';
import { InvalidCredentialsError, SignUpError, SyncOfflineError } from '../data/remote';
import { useSyncView } from '../data/syncState';
import { LoginScreen, type LoginMode } from './LoginScreen';
import { PASSWORD_MIN, signIn, signOut, signUp, syncNow } from '../service/syncService';

/** Synchronisierung (D-269): anmelden, Stand ansehen, abgleichen, abmelden. */
export function SyncPage() {
  const rt = useDb();
  const fmt = useFormatters();
  const view = useSyncView();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<'signIn' | 'sync' | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Rückkehr über den Link der Bestätigungsmail: Supabase hängt Zugangsdaten an die Adresse.
  // Sie werden nicht übernommen (die installierte App hat einen eigenen Speicher), sondern sofort
  // aus Adresse und Verlauf entfernt; angemeldet wird wie gewohnt mit E-Mail und Passwort.
  const [returned] = useState(() => {
    const hash = window.location.hash;
    if (hash.includes('error_description=')) return 'failed' as const;
    if (hash.includes('access_token=')) return 'confirmed' as const;
    return null;
  });
  const [notice, setNotice] = useState<string | null>(
    returned === 'failed' ? tSync.confirmFailed : returned ? tSync.confirmed : null,
  );
  const [mode, setMode] = useState<LoginMode>('signIn');
  const ts = tSync;

  useEffect(() => {
    if (returned) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [returned]);

  const run = () => {
    setBusy('sync');
    setError(null);
    syncNow(rt)
      .catch(() => undefined)
      .finally(() => {
        setBusy(null);
      });
  };

  const fail = (caught: unknown) => {
    setBusy(null);
    setError(
      caught instanceof InvalidCredentialsError
        ? ts.invalidCredentials
        : caught instanceof SignUpError
          ? ts.signUpErrors[caught.problem]
          : caught instanceof SyncOfflineError
            ? ts.offline
            : ts.failed,
    );
  };

  const submit = (how: LoginMode, email: string, password: string) => {
    setBusy('signIn');
    setError(null);
    setNotice(null);
    if (how === 'signIn') {
      signIn(rt.db, email, password)
        .then(() => {
          setBusy(null);
          run();
        })
        .catch(fail);
      return;
    }
    // Der Link in der Bestätigungsmail führt zurück auf diese Seite.
    signUp(rt.db, email, password, `${window.location.origin}/mehr/synchronisierung`)
      .then((result) => {
        setBusy(null);
        if (result.kind === 'signedIn') {
          run();
        } else {
          setMode('signIn');
          setNotice(ts.confirmSent(email.trim()));
        }
      })
      .catch(fail);
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
          // Beim Laden als beschäftigt markiert, wie die übrigen Seiten (D-344).
          <div aria-busy="true">
            <Skeleton className="h-40" />
          </div>
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
            mode={mode}
            notice={notice}
            passwordMin={PASSWORD_MIN}
            onModeChange={(next) => {
              setMode(next);
              setError(null);
              setNotice(null);
            }}
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
