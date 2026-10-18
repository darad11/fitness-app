import { useMemo, useState } from 'react';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Card, PageHeader, SegmentedControl, SelectField, Skeleton } from '@/shared/ui';
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

/** Fester Beispielzeitpunkt im Jänner, damit der Unterschied zwischen de-AT und de-DE sichtbar ist. */
const SAMPLE_DATE = new Date(2026, 0, 17, 21, 5);

export function SettingsPage() {
  const settings = useSettings();
  return (
    <>
      <PageHeader title={t.settings.title} back={{ to: '/mehr', label: t.more.title }} />
      {settings ? <SettingsForm settings={settings} /> : <SettingsSkeleton />}
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

  return (
    <div className="space-y-4">
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
