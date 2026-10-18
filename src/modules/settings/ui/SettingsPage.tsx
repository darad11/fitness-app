import { useState } from 'react';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Card, PageHeader, SegmentedControl, SelectField } from '@/shared/ui';
import { saveSettings } from '../data/settingsRepository';
import { useSettings } from '../data/useSettings';
import {
  SETTINGS_DEFAULTS,
  type LocaleSetting,
  type SettingsData,
  type ThemeSetting,
} from '../model/settings';
import { useFormatters } from '../service/formatting';

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
  const rt = useDb();
  const settings = useSettings();
  const formatters = useFormatters();
  const [saveFailed, setSaveFailed] = useState(false);
  const current = settings ?? SETTINGS_DEFAULTS;
  const loading = settings === undefined;

  const save = (patch: Partial<SettingsData>) => {
    setSaveFailed(false);
    saveSettings(rt, patch).catch((error: unknown) => {
      setSaveFailed(true);
      void logError(rt.db, { area: 'settings', error, route: window.location.pathname });
    });
  };

  return (
    <>
      <PageHeader title={t.settings.title} back={{ to: '/mehr', label: t.more.title }} />
      <div className="space-y-4">
        <Card title={t.settings.appearance}>
          <SegmentedControl
            legend={t.settings.themeLabel}
            options={THEME_OPTIONS}
            value={current.theme}
            onChange={(theme) => {
              save({ theme });
            }}
            hint={t.settings.themeHint}
            disabled={loading}
          />
        </Card>
        <Card title={t.settings.formatting}>
          <SelectField
            label={t.settings.localeLabel}
            options={LOCALE_OPTIONS}
            value={current.locale}
            onChange={(locale) => {
              save({ locale });
            }}
            hint={t.settings.formattingHint}
            disabled={loading}
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
    </>
  );
}
