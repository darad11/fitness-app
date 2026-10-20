import { useLiveQuery } from 'dexie-react-hooks';
import { Download, HardDrive } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  backupFileName,
  buildBackup,
  deliverBackup,
  getMetaValue,
  listSnapshots,
  logError,
  META_KEYS,
  persistentStorageStatus,
  useDb,
  type PersistResult,
  type SnapshotInfo,
} from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, Card, PageHeader, StatusList, type StatusItem } from '@/shared/ui';
import { useFormatters } from '../service/formatting';

type ExportState = 'idle' | 'busy' | 'shared' | 'downloaded' | 'cancelled' | 'failed';

interface StorageStatus {
  persist: PersistResult;
  usageBytes: number | null;
}

async function readStorageStatus(): Promise<StorageStatus> {
  const persist = await persistentStorageStatus();
  const usageBytes = await navigator.storage
    .estimate()
    .then((estimate) => (typeof estimate.usage === 'number' ? estimate.usage : null))
    .catch(() => null);
  return { persist, usageBytes };
}

function formatBytes(bytes: number, number: (value: number, digits: number) => string): string {
  if (bytes >= 1_000_000) return `${number(bytes / 1_000_000, 1)} MB`;
  if (bytes >= 1_000) return `${number(bytes / 1_000, 0)} kB`;
  return `${number(bytes, 0)} B`;
}

/**
 * Daten und Sicherung (S-35, AP 1.8): Speicherstatus (AK-PWA-05), JSON-Export (AK-DAT-01) und
 * die vorhandenen Snapshots (AK-DAT-06, nur Anzeige). Import, Wiederherstellen und Löschen
 * folgen mit M2 und M4 (AK-UX-01: keine Knöpfe ohne Funktion).
 */
export function DataPage() {
  const rt = useDb();
  const fmt = useFormatters();
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotInfo[] | null>(null);
  const [exportState, setExportState] = useState<ExportState>('idle');
  const lastExportAt = useLiveQuery(
    async () => (await getMetaValue(rt.db, META_KEYS.lastExportAt)) ?? null,
    [rt.db],
  );
  useEffect(() => {
    let active = true;
    void readStorageStatus().then((status) => {
      if (active) setStorage(status);
    });
    void listSnapshots().then(
      (list) => {
        if (active) setSnapshots(list);
      },
      () => {
        if (active) setSnapshots([]);
      },
    );
    return () => {
      active = false;
    };
  }, [rt.db]);

  const number = (value: number, digits: number) =>
    fmt.number(value, { maximumFractionDigits: digits });

  const exportNow = async () => {
    setExportState('busy');
    try {
      const now = new Date();
      const backup = await buildBackup(rt.db, rt.deviceId, { now: () => now });
      setExportState(await deliverBackup(rt.db, backup, backupFileName(now)));
    } catch (error) {
      void logError(rt.db, { area: 'export', error, route: window.location.pathname });
      setExportState('failed');
    }
  };

  const storageItems: StatusItem[] = storage
    ? [
        {
          id: 'persist',
          icon: HardDrive,
          tone: storage.persist === 'persisted' ? 'success' : 'neutral',
          content: t.data.persist[storage.persist],
        },
        ...(storage.usageBytes !== null
          ? [
              {
                id: 'usage',
                icon: HardDrive,
                tone: 'neutral' as const,
                content: t.data.usage(formatBytes(storage.usageBytes, number)),
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <PageHeader
        title={t.data.title}
        back={{ to: '/mehr/einstellungen', label: t.settings.title }}
      />
      <div className="space-y-4">
        <Card title={t.data.exportTitle}>
          <p className="text-muted">{t.data.exportText}</p>
          <p className="mt-2 text-sm text-muted">
            {typeof lastExportAt === 'string'
              ? t.data.lastExport(fmt.dateTimeShort(new Date(lastExportAt)))
              : lastExportAt === null
                ? t.data.noExportYet
                : ''}
          </p>
          <Button
            className="mt-4"
            disabled={exportState === 'busy'}
            onClick={() => {
              void exportNow();
            }}
          >
            <Download aria-hidden="true" className="size-5" />
            {t.data.exportButton}
          </Button>
          <p role="status" aria-live="polite" className="mt-3 text-sm">
            {exportState === 'idle' || exportState === 'busy'
              ? ''
              : t.data.exportResult[exportState]}
          </p>
        </Card>
        <Card title={t.data.storageTitle}>
          <div aria-busy={storage === null}>
            {storage ? <StatusList items={storageItems} /> : <p className="text-muted">…</p>}
          </div>
          <p className="mt-3 text-sm text-muted">{t.data.storageHint}</p>
        </Card>
        <Card title={t.data.snapshotsTitle}>
          <p className="mb-3 text-sm text-muted">{t.data.snapshotsText}</p>
          <div aria-busy={snapshots === null}>
            {snapshots === null ? null : snapshots.length === 0 ? (
              <p className="text-muted">{t.data.noSnapshots}</p>
            ) : (
              <ul className="divide-y divide-line">
                {snapshots.map((snapshot) => (
                  <li key={snapshot.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>
                      <span className="block font-medium">
                        {t.data.snapshotReason[snapshot.reason]}
                      </span>
                      <span className="block text-sm text-muted">
                        {fmt.dateTimeShort(new Date(snapshot.createdAt))} · {t.data.appVersion}{' '}
                        {snapshot.appVersion}
                      </span>
                    </span>
                    <span className="text-sm text-muted tabular-nums">
                      {formatBytes(snapshot.bytes, number)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
