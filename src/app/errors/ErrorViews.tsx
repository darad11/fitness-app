import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, ButtonLink, PageHeader } from '@/shared/ui';
import { useChunkRecovery, type ManualReason } from '../chunkRecovery';
import { hideStartSurface } from '../startSurface';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title={t.errors.notFoundTitle} />
      <p className="mb-6 text-muted">{t.errors.notFoundText}</p>
      <ButtonLink to="/heute">{t.errors.toToday}</ButtonLink>
    </>
  );
}

function ErrorContent() {
  return (
    <section role="alert" className="max-w-xl">
      <TriangleAlert aria-hidden="true" className="mb-3 size-8 text-danger" />
      <h1 className="mb-2 text-2xl font-semibold">{t.errors.routeTitle}</h1>
      <p className="mb-6 text-muted">{t.errors.routeText}</p>
      <Button
        onClick={() => {
          window.location.reload();
        }}
      >
        {t.common.reload}
      </Button>
    </section>
  );
}

const CHUNK_TEXT: Record<ManualReason, string> = {
  training: t.errors.chunkTraining,
  repeated: t.errors.chunkText,
  offline: t.errors.chunkOffline,
};

/** Nachgeladener Teil fehlt (E-16, D-343): ruhiger Hinweis statt Fehlermeldung. */
function ChunkErrorContent({ reason }: { reason: ManualReason }) {
  return (
    <section role="alert" className="max-w-xl">
      <RefreshCw aria-hidden="true" className="mb-3 size-8 text-muted" />
      <h1 className="mb-2 text-2xl font-semibold">{t.errors.chunkTitle}</h1>
      <p className="mb-6 text-muted">{CHUNK_TEXT[reason]}</p>
      <Button
        onClick={() => {
          window.location.reload();
        }}
      >
        {t.common.reload}
      </Button>
    </section>
  );
}

/** Fehleransicht je nach Ursache; bei einem fehlenden Teil lädt die App einmal selbst neu. */
function RouteErrorContent({ error }: { error: unknown }) {
  const recovery = useChunkRecovery(error);
  if (recovery === null) return <ErrorContent />;
  if (recovery === 'pending' || recovery.action === 'reload') {
    return (
      <p role="status" className="text-muted">
        {t.errors.reloading}
      </p>
    );
  }
  return <ChunkErrorContent reason={recovery.reason} />;
}

function useLoggedRouteError(area: string): unknown {
  const error = useRouteError();
  const { db } = useDb();
  useEffect(() => {
    if (isRouteErrorResponse(error) && error.status === 404) return;
    void logError(db, { area, error, route: window.location.pathname });
  }, [area, db, error]);
  return error;
}

/** Fehlergrenze je Ansicht: Navigation und andere Bereiche bleiben nutzbar (S-44, AK-DAT-09). */
export function RouteErrorView() {
  const error = useLoggedRouteError('route');
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  return <RouteErrorContent error={error} />;
}

/** Fehlergrenze des Rahmens, falls die Shell selbst ausfällt. */
export function RootErrorView() {
  const error = useLoggedRouteError('root');
  useEffect(() => {
    hideStartSurface();
  }, []);
  return (
    <main className="page-gutters mx-auto max-w-content py-10">
      <RouteErrorContent error={error} />
    </main>
  );
}

/** Platzhalter während des ersten Ladens; bewusst ohne Ladekreisel. */
export function ShellFallback() {
  return <div aria-busy="true" className="min-h-dvh bg-bg" />;
}
