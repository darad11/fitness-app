import { useState } from 'react';
import { DISPLAY_NAME_MAX, saveProfile, useProfile } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { tMore } from '@/shared/i18n/de-more';
import { Button, Card, PageHeader, Skeleton } from '@/shared/ui';
import { GoalsPanel } from './GoalsPanel';

/** Profil und Ziele (S-33, AK-SET-01, AK-SET-05): Anzeigename optional, Zielgewicht, Wochenziel, Historie. */
export function ProfilePage() {
  const rt = useDb();
  const profile = useProfile();
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const value = draft ?? profile?.displayName ?? '';
  return (
    <>
      <PageHeader title={tMore.more.profile} back={{ to: '/mehr', label: tMore.more.title }} />
      <div className="grid gap-4">
        <Card title={tMore.profile.title}>
          {profile === undefined ? (
            <div aria-busy="true">
              <Skeleton className="h-12" />
            </div>
          ) : (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setError(false);
                saveProfile(rt, { displayName: value }).then(
                  () => {
                    setDraft(null);
                    setSaved(true);
                  },
                  (caught: unknown) => {
                    void logError(rt.db, {
                      area: 'settings',
                      error: caught,
                      route: '/mehr/profil',
                    });
                    setError(true);
                  },
                );
              }}
            >
              <div className="min-w-0 flex-1">
                <label htmlFor="anzeigename" className="mb-1 block text-sm font-medium">
                  {tMore.profile.nameLabel}
                </label>
                <input
                  id="anzeigename"
                  type="text"
                  autoComplete="given-name"
                  maxLength={DISPLAY_NAME_MAX}
                  value={value}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setSaved(false);
                  }}
                  className="field w-full"
                />
              </div>
              <Button type="submit" disabled={draft === null}>
                {tMore.profile.save}
              </Button>
            </form>
          )}
          <p className="mt-2 text-sm text-muted">{tMore.profile.nameHint}</p>
          {saved ? (
            <p role="status" className="mt-1 text-sm text-success">
              {tMore.profile.saved}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="mt-1 text-sm text-danger">
              {t.goals.saveFailed}
            </p>
          ) : null}
        </Card>
        <GoalsPanel />
      </div>
    </>
  );
}
