import { useLiveQuery } from 'dexie-react-hooks';
import { CircleCheck, MonitorSmartphone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { META_KEYS, getMetaValue, parseDismissedHints, restoreHint, useDb } from '@/shared/db';
import { tMore } from '@/shared/i18n/de-more';
import { currentPlatform, type PlatformInfo } from '@/shared/lib/platform';
import { promptInstall, useInstallPrompt, type InstallOutcome } from '@/shared/pwa/installPrompt';
import { Button, Card, PageHeader, StatusList } from '@/shared/ui';

type GuideId = 'iphone' | 'ipad' | 'mac';

const GUIDES: Record<GuideId, { title: string; steps: readonly string[] }> = {
  iphone: { title: tMore.install.iphoneTitle, steps: tMore.install.iphoneSteps },
  ipad: { title: tMore.install.ipadTitle, steps: tMore.install.ipadSteps },
  mac: { title: tMore.install.macTitle, steps: tMore.install.macSteps },
};

/** Die Anleitung des erkannten Geräts steht oben. */
function guideOrder(platform: PlatformInfo): GuideId[] {
  if (platform.isIpad) return ['ipad', 'iphone', 'mac'];
  if (platform.isMac) return ['mac', 'iphone', 'ipad'];
  return ['iphone', 'ipad', 'mac'];
}

export function InstallPage() {
  const rt = useDb();
  const platform = useMemo(() => currentPlatform(), []);
  const { canPrompt, installedNow } = useInstallPrompt();
  const [outcome, setOutcome] = useState<InstallOutcome | null>(null);
  const dismissedHints = useLiveQuery(
    async () => parseDismissedHints(await getMetaValue(rt.db, META_KEYS.dismissedHints)),
    [rt.db],
  );
  const installed = platform.isStandalone || installedNow;
  const hintHidden = platform.needsIosInstallHint && dismissedHints?.includes('ios-install');

  return (
    <>
      <PageHeader
        title={tMore.install.title}
        back={{ to: '/mehr/einstellungen', label: tMore.settings.title }}
      />
      <div className="space-y-4">
        <Card>
          <StatusList
            items={[
              {
                id: 'mode',
                icon: installed ? CircleCheck : MonitorSmartphone,
                tone: installed ? 'success' : 'neutral',
                content: installed ? tMore.install.statusInstalled : tMore.install.statusBrowser,
              },
            ]}
          />
          {installed ? null : (
            <p className="mt-2 text-sm text-muted">{tMore.install.dataSeparation}</p>
          )}
          {canPrompt ? (
            <Button
              className="mt-4"
              onClick={() => {
                void promptInstall().then(setOutcome);
              }}
            >
              {tMore.install.promptButton}
            </Button>
          ) : null}
          {outcome === 'accepted' ? (
            <p role="status" className="mt-3">
              {tMore.install.promptAccepted}
            </p>
          ) : null}
          {hintHidden ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted">{tMore.install.hintHidden}</p>
              <Button
                variant="secondary"
                onClick={() => {
                  void restoreHint(rt.db, 'ios-install');
                }}
              >
                {tMore.install.showHintAgain}
              </Button>
            </div>
          ) : null}
        </Card>
        {guideOrder(platform).map((id) => (
          <Card key={id} title={GUIDES[id].title}>
            <ol className="list-decimal space-y-2 pl-5">
              {GUIDES[id].steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Card>
        ))}
        <p className="text-sm text-muted">{tMore.install.offlineNote}</p>
      </div>
    </>
  );
}
