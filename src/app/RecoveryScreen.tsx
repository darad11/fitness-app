import { DatabaseZap } from 'lucide-react';
import { t } from '@/shared/i18n/de';
import { applyUpdate, usePwaState } from '@/shared/pwa/state';
import { Button } from '@/shared/ui';

function errorNames(error: unknown): string[] {
  if (!(error instanceof Error)) return [];
  const inner = (error as Error & { inner?: unknown }).inner;
  return inner instanceof Error ? [error.name, inner.name] : [error.name];
}

/** Ursache in einfachen Worten (architecture.md Abschnitt 7). */
export function recoveryCause(error: unknown): string {
  const names = errorNames(error);
  if (
    names.some((name) => ['MissingAPIError', 'SecurityError', 'InvalidStateError'].includes(name))
  ) {
    return t.recovery.causeStorageBlocked;
  }
  if (names.includes('VersionError')) return t.recovery.causeNewerVersion;
  if (names.includes('ConnectionLostError')) return t.recovery.causeConnectionLost;
  return t.recovery.causeUnknown;
}

/**
 * Vollbild, wenn sich die Datenbank nicht öffnen lässt (S-43, Grundfassung aus M0).
 * Snapshot-Wiederherstellung, Export des Fehlerprotokolls und Zurücksetzen folgen mit M1 und M4.
 */
export function RecoveryScreen({ error }: { error: unknown }) {
  const { updateAvailable } = usePwaState();
  return (
    <main className="page-gutters mx-auto max-w-xl py-12">
      <DatabaseZap aria-hidden="true" className="mb-4 size-10 text-warning" />
      <h1 className="mb-3 text-2xl font-semibold">{t.recovery.title}</h1>
      <p className="mb-4">{t.recovery.text}</p>
      <p className="mb-8 text-muted">
        <span className="font-semibold">{t.recovery.causeLabel}:</span> {recoveryCause(error)}
      </p>
      <div className="flex flex-wrap gap-3">
        {updateAvailable ? (
          <Button
            onClick={() => {
              void applyUpdate();
            }}
          >
            {t.banners.updateNow}
          </Button>
        ) : null}
        <Button
          variant={updateAvailable ? 'secondary' : 'primary'}
          onClick={() => {
            window.location.reload();
          }}
        >
          {t.common.retry}
        </Button>
      </div>
    </main>
  );
}
