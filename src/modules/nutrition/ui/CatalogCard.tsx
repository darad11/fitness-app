import { FileUp, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, buttonClasses, Card, Dialog, Skeleton } from '@/shared/ui';
import { useImportedCatalog } from '../data/catalogStore';
import {
  CatalogFileError,
  CatalogMissingError,
  commitImport,
  deleteCatalog,
  prepareImport,
  type PreparedImport,
} from '../service/catalogService';

type Busy = 'reading' | 'saving' | 'removing' | undefined;

/**
 * Lebensmitteldaten importieren (D-263): Datei der BLS-Recherche auswählen, Vorschau prüfen,
 * übernehmen. Alles bleibt auf dem Gerät; nichts wird hochgeladen.
 */
export function CatalogCard() {
  const { db } = useDb();
  const fmt = useFormatters();
  const catalog = useImportedCatalog();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreparedImport>();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState<Busy>();
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string>();
  const n = (value: number) => fmt.number(value);
  const tc = t.nutrition.catalog;

  const pick = async (file: File | undefined) => {
    if (input.current) input.current.value = '';
    if (!file) return;
    setError(undefined);
    setDone(undefined);
    setBusy('reading');
    try {
      const prepared = await prepareImport(db, file);
      if (prepared.result.rows.length === 0) setError(tc.nothingNew);
      else setPreview(prepared);
    } catch (e) {
      setError(
        e instanceof CatalogMissingError
          ? tc.brandsNeedCatalog
          : e instanceof CatalogFileError
            ? tc.wrongFile
            : tc.failed,
      );
      if (!(e instanceof CatalogFileError || e instanceof CatalogMissingError)) {
        void logError(db, { area: 'nutrition', error: e, route: window.location.pathname });
      }
    } finally {
      setBusy(undefined);
    }
  };

  const save = async () => {
    if (!preview) return;
    setBusy('saving');
    try {
      await commitImport(db, preview);
      setDone(
        preview.kind === 'brands'
          ? tc.brandsImported(n(preview.matched))
          : tc.imported(n(preview.result.rows.length)),
      );
      setPreview(undefined);
    } catch (e) {
      setError(tc.failed);
      setPreview(undefined);
      void logError(db, { area: 'nutrition', error: e, route: window.location.pathname });
    } finally {
      setBusy(undefined);
    }
  };

  const remove = async () => {
    setBusy('removing');
    try {
      await deleteCatalog(db);
      setDone(tc.removed);
    } catch (e) {
      setError(tc.failed);
      void logError(db, { area: 'nutrition', error: e, route: window.location.pathname });
    } finally {
      setConfirmRemove(false);
      setBusy(undefined);
    }
  };

  const summary = preview?.kind === 'catalog' ? preview.result.summary : undefined;

  return (
    <Card title={tc.title} className="mt-6">
      {catalog === undefined ? (
        <Skeleton className="h-16" />
      ) : catalog === null ? (
        <p className="text-muted">{tc.empty}</p>
      ) : (
        <div className="space-y-1">
          <p className="font-medium">{tc.status(n(catalog.info.count))}</p>
          <p className="text-sm text-muted">
            {tc.statusDetail(fmt.dayMonthYear(new Date(catalog.info.importedAt)))}
          </p>
          <p className="text-sm text-muted">
            {catalog.info.brandCount === undefined
              ? tc.brandsMissing
              : tc.brandsStatus(n(catalog.info.brandCount))}
          </p>
        </div>
      )}
      <p className="mt-3 text-sm text-muted">{tc.hint}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <label
          className={buttonClasses(
            'primary',
            'md',
            'cursor-pointer has-[:disabled]:cursor-default has-[:disabled]:opacity-60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
          )}
        >
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            disabled={busy !== undefined}
            onChange={(event) => void pick(event.target.files?.[0])}
          />
          <FileUp aria-hidden="true" className="size-5" />
          {busy === 'reading' ? tc.reading : catalog ? tc.replace : tc.choose}
        </label>
        {catalog ? (
          <Button
            variant="danger"
            disabled={busy !== undefined}
            onClick={() => {
              setConfirmRemove(true);
            }}
          >
            <Trash2 aria-hidden="true" className="size-5" />
            {tc.remove}
          </Button>
        ) : null}
      </div>
      <p aria-live="polite" className="mt-3 text-sm">
        {error ? <span className="text-danger">{error}</span> : done}
      </p>

      <Dialog
        open={preview !== undefined}
        onClose={() => {
          if (busy !== 'saving') setPreview(undefined);
        }}
        title={preview?.kind === 'brands' ? tc.brandsPreviewTitle : tc.previewTitle}
        closeLabel={t.nutrition.cancel}
        actions={
          <>
            <Button
              variant="secondary"
              disabled={busy === 'saving'}
              onClick={() => {
                setPreview(undefined);
              }}
            >
              {t.nutrition.cancel}
            </Button>
            <Button disabled={busy === 'saving'} onClick={() => void save()}>
              {busy === 'saving' ? tc.saving : tc.confirm}
            </Button>
          </>
        }
      >
        {preview?.kind === 'brands' ? (
          <div className="space-y-3">
            <p className="font-medium">{tc.brandsPreview(n(preview.matched))}</p>
            <p className="text-sm text-muted">{tc.brandsHow}</p>
          </div>
        ) : null}
        {summary ? (
          <div className="space-y-3">
            <p className="font-medium">{tc.previewKept(n(preview?.result.rows.length ?? 0))}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>{tc.keptOenwt(n(summary.kept.oenwt))}</li>
            </ul>
            <p className="text-sm text-muted">{tc.previewSkipped}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              <li>{tc.skippedBls(n(summary.skipped.bls))}</li>
              <li>{tc.skippedDiscontinued(n(summary.skipped.discontinued))}</li>
              {summary.skipped.ambiguous > 0 ? (
                <li>{tc.skippedAmbiguous(n(summary.skipped.ambiguous))}</li>
              ) : null}
              {summary.skipped.invalid > 0 ? (
                <li>{tc.skippedInvalid(n(summary.skipped.invalid))}</li>
              ) : null}
            </ul>
            {catalog ? <p className="text-sm">{tc.replaces}</p> : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={confirmRemove}
        onClose={() => {
          setConfirmRemove(false);
        }}
        title={tc.removeTitle}
        closeLabel={t.nutrition.cancel}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmRemove(false);
              }}
            >
              {t.nutrition.cancel}
            </Button>
            <Button variant="danger" disabled={busy === 'removing'} onClick={() => void remove()}>
              {tc.remove}
            </Button>
          </>
        }
      >
        <p>{tc.removeText}</p>
      </Dialog>
    </Card>
  );
}
