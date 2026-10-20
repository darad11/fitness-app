import { Database, Download, Footprints } from 'lucide-react';
import { useMemo, useState } from 'react';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import {
  isWakeLockSupported,
  subscribeWakeLockStatus,
  wakeLockStatus,
} from '@/shared/lib/wakeLock';
import {
  Card,
  LinkList,
  PageHeader,
  SegmentedControl,
  SelectField,
  Skeleton,
  Switch,
} from '@/shared/ui';
import { useSyncExternalStore } from 'react';
import { saveSettings } from '../data/settingsRepository';
import { useSettings } from '../data/useSettings';
import type { LocaleSetting, SettingsData, ThemeSetting } from '../model/settings';
import { formattersFor } from '../service/formatting';

const THEME_OPTIONS: readonly { value: ThemeSetting; label: string }[] = [
  { value: 'light', label: t.settings.themeLight },
  { value: 'dark', label: t.settings.themeDark },
  { value: 'system', label: t.settings.themeSystem },
];

const LOCALE_OPTIONS: readonly { value: LocaleSetting; label: string }[] = [
  { value: 'auto', label: t.settings.localeAuto },
  { value: 'de-AT', label: t.settings.localeAT },
  { value: 'de-DE', label: t.settings.localeDE },
  { value: 'de-CH', label: t.settings.localeCH },
];

/** Standardpause in Sekunden (AK-SET-02: 0 bis 600 s); als Auswahl, damit sie im Studio schnell geht. */
const REST_OPTIONS = [0, 30, 45, 60, 75, 90, 105, 120, 150, 180, 240, 300, 600] as const;
const WEIGHT_STEP_OPTIONS = ['0.5', '1', '1.25', '2.5', '5'] as const;

/** Fester Beispielzeitpunkt im Jänner, damit der Unterschied zwischen de-AT und de-DE sichtbar ist. */
const SAMPLE_DATE = new Date(2026, 0, 17, 21, 5);

export function SettingsPage() {
  const settings = useSettings();
  return (
    <>
      <PageHeader title={t.settings.title} back={{ to: '/mehr', label: t.more.title }} />
      {settings ? <SettingsForm settings={settings} /> : <SettingsSkeleton />}
      {/* Daten, Installieren und Schritte unter den Einstellungen statt unter „Mehr“ (D-280). */}
      <h2 className="mt-6 mb-2 px-1 text-sm font-semibold text-muted">{t.settings.more}</h2>
      <LinkList
        label={t.settings.more}
        items={[
          { to: '/mehr/daten', label: t.more.data, icon: Database },
          { to: '/mehr/installieren', label: t.more.install, icon: Download },
          { to: '/mehr/schritte', label: t.more.steps, icon: Footprints },
        ]}
      />
    </>
  );
}

/**
 * Bis die Einstellungen geladen sind, nur die Form der Karten. Standardwerte würden kurz eine
 * falsche Auswahl zeigen und dann umspringen.
 */
function SettingsSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <Card title={t.settings.training}>
        <Skeleton className="h-40" />
      </Card>
      <Card title={t.settings.appearance}>
        <Skeleton className="h-[52px]" />
      </Card>
      <Card title={t.settings.formatting}>
        <Skeleton className="h-11" />
      </Card>
    </div>
  );
}

function SettingsForm({ settings }: { settings: SettingsData }) {
  const rt = useDb();
  const [saveFailed, setSaveFailed] = useState(false);
  // Aus denselben geladenen Werten wie die Auswahl, damit das Beispiel nicht nachträglich umspringt.
  const formatters = useMemo(() => formattersFor(settings.locale), [settings.locale]);

  const save = (patch: Partial<SettingsData>) => {
    setSaveFailed(false);
    saveSettings(rt, patch).catch((error: unknown) => {
      setSaveFailed(true);
      void logError(rt.db, { area: 'settings', error, route: window.location.pathname });
    });
  };

  const wakeStatus = useSyncExternalStore(subscribeWakeLockStatus, wakeLockStatus, wakeLockStatus);
  const restOptions = REST_OPTIONS.map((sec) => ({
    value: String(sec),
    label: sec === 0 ? t.settings.off : t.settings.seconds(sec),
  }));
  const restValue = REST_OPTIONS.includes(settings.restDefaultSec as (typeof REST_OPTIONS)[number])
    ? String(settings.restDefaultSec)
    : String(settings.restDefaultSec);
  const stepOptions = WEIGHT_STEP_OPTIONS.map((step) => ({
    value: step,
    label: formatters.loadKg(Number(step)),
  }));

  return (
    <div className="space-y-4">
      <Card title={t.settings.training}>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label={t.settings.restDefault}
            options={
              restOptions.some((o) => o.value === restValue)
                ? restOptions
                : [
                    ...restOptions,
                    { value: restValue, label: t.settings.seconds(settings.restDefaultSec) },
                  ]
            }
            value={restValue}
            onChange={(value) => {
              save({ restDefaultSec: Number(value) });
            }}
            hint={t.settings.restDefaultHint}
          />
          <SelectField
            label={t.settings.weightStep}
            options={
              stepOptions.some((o) => Number(o.value) === settings.weightStepKg)
                ? stepOptions
                : [
                    ...stepOptions,
                    {
                      value: String(settings.weightStepKg),
                      label: formatters.loadKg(settings.weightStepKg),
                    },
                  ]
            }
            value={String(settings.weightStepKg)}
            onChange={(value) => {
              save({ weightStepKg: Number(value) });
            }}
          />
        </div>
        <div className="mt-2 divide-y divide-line">
          <Switch
            label={t.settings.autoStartRest}
            checked={settings.autoStartRest}
            onChange={(autoStartRest) => {
              save({ autoStartRest });
            }}
          />
          <Switch
            label={t.settings.restSound}
            checked={settings.restSound}
            hint={t.settings.restSoundHint}
            onChange={(restSound) => {
              save({ restSound });
            }}
          />
          <Switch
            label={t.settings.keepAwake}
            checked={settings.keepAwake}
            hint={
              !isWakeLockSupported()
                ? t.settings.keepAwakeUnsupported
                : wakeStatus === 'denied'
                  ? t.settings.keepAwakeDenied
                  : undefined
            }
            onChange={(keepAwake) => {
              save({ keepAwake });
            }}
          />
        </div>
      </Card>
      <Card title={t.settings.appearance}>
        <SegmentedControl
          legend={t.settings.themeLabel}
          options={THEME_OPTIONS}
          value={settings.theme}
          onChange={(theme) => {
            save({ theme });
          }}
          hint={t.settings.themeHint}
        />
      </Card>
      <Card title={t.settings.formatting}>
        <SelectField
          label={t.settings.localeLabel}
          options={LOCALE_OPTIONS}
          value={settings.locale}
          onChange={(locale) => {
            save({ locale });
          }}
          hint={t.settings.formattingHint}
        />
        <p className="mt-3 tabular-nums" aria-live="polite">
          {t.settings.example(
            formatters.dayMonthYear(SAMPLE_DATE),
            formatters.time(SAMPLE_DATE),
            formatters.number(1234.5),
            formatters.loadKg(72.5),
          )}
        </p>
      </Card>
      {saveFailed ? (
        <p role="alert" className="text-danger">
          {t.settings.saveFailed}
        </p>
      ) : null}
    </div>
  );
}
