import { FileUp, RotateCcw } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { loadSyncSignedIn } from '@/modules/sync';
import { useActiveSession } from '@/modules/training';
import { deliverBackup, logError, useDb } from '@/shared/db';
import { tBackup } from '@/shared/i18n/de-backup';
import { Button, buttonClasses, Card, Dialog } from '@/shared/ui';
import type { BackupSummary, CheckedBackup, Rejection } from '../model/backup';
import {
  CurrentNotSavedError,
  hasLocalData,
  readBackupFile,
  restoreBackup,
  TrainingRunningError,
} from '../service/restoreService';

interface Ready {
  backup: CheckedBackup;
  summary: BackupSummary;
  /** Liegt auf diesem Gerät schon etwas? Dann sichert FORM es vorher als Datei. */
  hasLocal: boolean;
  signedIn: boolean;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'reading' }
  | { kind: 'rejected'; rejection: Rejection }
  | { kind: 'ready'; ready: Ready; note?: 'notSaved' | 'training' }
  | { kind: 'restoring'; ready: Ready }
  | { kind: 'done'; exportedAt: string }
  | { kind: 'failed' };

function rejectionText(rejection: Rejection): string {
  if (rejection.reason === 'invalid') {
    return tBackup.rejected.invalid(tBackup.kinds[rejection.type ?? ''] ?? tBackup.otherKind);
  }
  return tBackup.rejected[rejection.reason];
}

/**
 * Wiederherstellen aus dem Export (A-14, D-345): Datei wählen, prüfen, Zusammenfassung, zweimal
 * bestätigen. Vorher sichert FORM den aktuellen Stand als Datei; ohne diese Sicherung und während
 * eines Trainings ersetzt es nichts. Jede Ablehnung lässt die Daten unverändert.
 */
export function RestoreCard() {
  const rt = useDb();
  const fmt = useFormatters();
  const active = useActiveSession();
  const summaryId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [confirming, setConfirming] = useState(false);
  const training = active !== null && active !== undefined;
  const day = (key: string) => fmt.dayMonthYear(new Date(`${key}T12:00:00`));

  const pick = async (file: File | undefined) => {
    if (input.current) input.current.value = '';
    if (!file) return;
    setStatus({ kind: 'reading' });
    try {
      const result = await readBackupFile(rt.db, file);
      if (!result.ok) {
        setStatus({ kind: 'rejected', rejection: result.rejection });
        return;
      }
      const [hasLocal, signedIn] = await Promise.all([
        hasLocalData(rt.db),
        loadSyncSignedIn(rt.db).catch(() => false),
      ]);
      setStatus({
        kind: 'ready',
        ready: { backup: result.backup, summary: result.summary, hasLocal, signedIn },
      });
    } catch (error) {
      void logError(rt.db, { area: 'backup', error, route: window.location.pathname });
      setStatus({ kind: 'failed' });
    }
  };

  const restore = async (ready: Ready) => {
    setStatus({ kind: 'restoring', ready });
    try {
      await restoreBackup(rt, ready.backup, {
        deliver: (backup, fileName) => deliverBackup(rt.db, backup, fileName),
      });
      setStatus({ kind: 'done', exportedAt: ready.summary.exportedAt });
    } catch (error) {
      if (error instanceof CurrentNotSavedError) {
        setStatus({ kind: 'ready', ready, note: 'notSaved' });
      } else if (error instanceof TrainingRunningError) {
        setStatus({ kind: 'ready', ready, note: 'training' });
      } else {
        void logError(rt.db, { area: 'backup', error, route: window.location.pathname });
        setStatus({ kind: 'failed' });
      }
    } finally {
      setConfirming(false);
    }
  };

  const busy = status.kind === 'reading' || status.kind === 'restoring';
  const ready = status.kind === 'ready' || status.kind === 'restoring' ? status.ready : null;
  const summary = ready?.summary;

  return (
    <Card title={tBackup.title}>
      <p className="text-muted">{tBackup.text}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <label
          className={buttonClasses(
            ready ? 'secondary' : 'primary',
            'md',
            'cursor-pointer has-[:disabled]:cursor-default has-[:disabled]:opacity-60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
          )}
        >
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            disabled={busy}
            onChange={(event) => void pick(event.target.files?.[0])}
          />
          <FileUp aria-hidden="true" className="size-5" />
          {status.kind === 'reading' ? tBackup.reading : tBackup.choose}
        </label>
      </div>

      {ready && summary ? (
        <section aria-labelledby={summaryId} className="mt-5">
          <h3 id={summaryId} className="font-semibold">
            {tBackup.summaryTitle}
          </h3>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">{tBackup.exportedAtLabel}</dt>
            <dd>{fmt.dateTimeShort(new Date(summary.exportedAt))}</dd>
            <dt className="text-muted">{tBackup.periodLabel}</dt>
            <dd>
              {summary.from && summary.to
                ? tBackup.period(day(summary.from), day(summary.to))
                : tBackup.periodNone}
            </dd>
            <dt className="text-muted">{tBackup.trainings}</dt>
            <dd className="tabular-nums">{fmt.number(summary.trainings)}</dd>
            <dt className="text-muted">{tBackup.foodEntries}</dt>
            <dd className="tabular-nums">{fmt.number(summary.foodEntries)}</dd>
            <dt className="text-muted">{tBackup.tasks}</dt>
            <dd className="tabular-nums">{fmt.number(summary.tasks)}</dd>
          </dl>
          <p className="mt-3 text-sm">{ready.hasLocal ? tBackup.replaceHint : tBackup.emptyHint}</p>
          {ready.signedIn ? <p className="mt-2 text-sm">{tBackup.syncHint}</p> : null}
          {training ? <p className="mt-2 text-sm">{tBackup.trainingRunning}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="danger"
              disabled={busy || training}
              onClick={() => {
                setConfirming(true);
              }}
            >
              <RotateCcw aria-hidden="true" className="size-5" />
              {tBackup.restore}
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setStatus({ kind: 'idle' });
              }}
            >
              {tBackup.cancel}
            </Button>
          </div>
        </section>
      ) : null}

      <p role="status" aria-live="polite" className="mt-3 text-sm">
        {status.kind === 'rejected' ? (
          <>
            <span className="text-danger">{rejectionText(status.rejection)}</span>{' '}
            {tBackup.unchanged}
          </>
        ) : status.kind === 'ready' && status.note === 'notSaved' ? (
          tBackup.notSaved
        ) : status.kind === 'ready' && status.note === 'training' ? (
          tBackup.trainingRunning
        ) : status.kind === 'restoring' ? (
          tBackup.busy
        ) : status.kind === 'done' ? (
          tBackup.done(fmt.dateTimeShort(new Date(status.exportedAt)))
        ) : status.kind === 'failed' ? (
          <span className="text-danger">
            {tBackup.failed} {tBackup.unchanged}
          </span>
        ) : (
          ''
        )}
      </p>

      <Dialog
        open={confirming && ready !== null}
        onClose={() => {
          if (status.kind !== 'restoring') setConfirming(false);
        }}
        title={ready?.hasLocal === false ? tBackup.confirmTitleEmpty : tBackup.confirmTitle}
        closeLabel={tBackup.cancel}
        actions={
          <>
            <Button
              variant="secondary"
              disabled={status.kind === 'restoring'}
              onClick={() => {
                setConfirming(false);
              }}
            >
              {tBackup.cancel}
            </Button>
            <Button
              variant="danger"
              disabled={status.kind === 'restoring' || training}
              onClick={() => {
                if (ready) void restore(ready);
              }}
            >
              {status.kind === 'restoring'
                ? tBackup.busy
                : ready?.hasLocal === false
                  ? tBackup.confirmEmpty
                  : tBackup.confirm}
            </Button>
          </>
        }
      >
        <p>{ready?.hasLocal === false ? tBackup.confirmTextEmpty : tBackup.confirmText}</p>
      </Dialog>
    </Card>
  );
}
