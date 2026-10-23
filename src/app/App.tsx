import type { DataRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { isChunkLoadError } from './chunkRecovery';

/**
 * Fehler beim Zeichnen meldet React Router in der Konsole. Ein fehlender nachgeladener Teil ist
 * behandelt (einmal neu laden oder ruhiger Hinweis, Eintrag im Fehlerprotokoll, D-343) und bleibt
 * dort weg; alles andere meldet es wie bisher.
 */
function reportRouterError(error: unknown, info: { errorInfo?: unknown }) {
  if (info.errorInfo === undefined || isChunkLoadError(error)) return;
  console.error('React Router caught the following error during render', error);
}

export function App({ runtime, router }: { runtime: DbRuntime; router: DataRouter }) {
  return (
    <DbProvider runtime={runtime}>
      <RouterProvider router={router} onError={reportRouterError} />
    </DbProvider>
  );
}
