import { useState } from 'react';
import { useActiveSession } from '@/modules/training';
import { useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { appInfo } from '@/shared/lib/env';
import { checkForUpdate, usePwaState, type UpdateCheckResult } from '@/shared/pwa/state';
import { Button, Card, PageHeader } from '@/shared/ui';
import { useFormatters } from '../service/formatting';

type CheckState = 'idle' | 'checking' | UpdateCheckResult;

const CHECK_MESSAGES: Record<Exclude<CheckState, 'idle'>, string> = {
  checking: t.about.checking,
  'update-available': t.about.updateFound,
  'up-to-date': t.about.upToDate,
  failed: t.about.updateFailed,
  unavailable: t.about.updateUnavailable,
};

/**
 * Über die App (FORM D-316): Logo der Marke ohne Claim, darunter wie bisher Version, Build,
 * Umgebung (AK-PWA-07), Speicher-ID und die Suche nach Updates.
 */
export function AboutPage() {
  const { deviceId } = useDb();
  const formatters = useFormatters();
  const pwa = usePwaState();
  const [check, setCheck] = useState<CheckState>('idle');
  const buildTime = new Date(appInfo.buildTime);
  const buildLabel = Number.isNaN(buildTime.getTime())
    ? appInfo.buildSha
    : `${appInfo.buildSha} · ${formatters.dateTimeShort(buildTime)}`;
  const training = useActiveSession() !== null;
  const waiting = pwa.updateAvailable || pwa.reloadPending;
  const message =
    check === 'idle' && waiting
      ? training
        ? t.about.updateAfterTraining
        : t.about.updateFound
      : check === 'idle'
        ? ''
        : CHECK_MESSAGES[check];

  const rows: readonly [string, string][] = [
    [t.about.version, appInfo.version],
    [t.about.build, buildLabel],
    [t.about.environment, t.about.environments[appInfo.env]],
    [t.about.storageId, deviceId],
  ];

  return (
    <>
      <PageHeader title={t.about.title} back={{ to: '/mehr', label: t.more.title }} />
      <div className="grid gap-stack">
        <Card>
          {/* Logo der Marke ohne Claim (FORM, D-316), darunter Version und Updates wie bisher. */}
          <img
            src="/brand/logo-anmeldung-dunkel.svg"
            alt={t.app.name}
            width={280}
            height={67}
            className="brand-logo mx-auto mt-2 mb-6"
          />
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted">{label}</dt>
                <dd className="tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-muted">{t.about.storageIdHint}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              disabled={check === 'checking'}
              onClick={() => {
                setCheck('checking');
                void checkForUpdate().then(setCheck);
              }}
            >
              {t.about.checkUpdate}
            </Button>
            <p aria-live="polite" className="text-sm">
              {message}
            </p>
          </div>
        </Card>
        <Card title={t.about.privacyTitle}>
          <p>{t.about.privacyText}</p>
        </Card>
      </div>
    </>
  );
}
