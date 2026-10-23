import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { App } from './app/App';
import { installChunkRecovery, isChunkLoadError } from './app/chunkRecovery';
import { RecoveryScreen } from './app/RecoveryScreen';
import { routes } from './app/routes';
import {
  ConnectionLostError,
  controlledRestart,
  installGlobalErrorHandlers,
  logError,
  openRuntime,
  setConnectionState,
  watchDatabaseHealth,
  type DbRuntime,
} from './shared/db';
import { hasActiveSession } from './modules/training';
import { listenForInstallPrompt } from './shared/pwa/installPrompt';
import { startServiceWorker } from './shared/pwa/register';
import './app/styles.css';

let runtime: DbRuntime | null = null;

async function start(): Promise<void> {
  const container = document.getElementById('root');
  if (!container) throw new Error('Element #root fehlt');
  // Wie React selbst, nur ohne die behandelten fehlenden nachgeladenen Teile (D-343).
  const root = createRoot(container, {
    onCaughtError: (error) => {
      if (!isChunkLoadError(error)) console.error(error);
    },
  });

  installGlobalErrorHandlers(() => runtime?.db ?? null);
  listenForInstallPrompt();
  // Läuft ein Training, lädt die App nie von selbst neu (E-16, D-343).
  const trainingRunning = async () => (runtime ? hasActiveSession(runtime.db) : false);
  installChunkRecovery(trainingRunning);
  // Auch bei Datenbankfehlern registrieren, damit eine korrigierte Version ankommen kann.
  startServiceWorker({
    onError: (error) => {
      void logError(runtime?.db ?? null, { area: 'service-worker', error });
    },
    canReload: async () => !(await trainingRunning()),
  });

  try {
    runtime = await openRuntime({
      onVersionChange: () => {
        setConnectionState('replaced');
      },
    });
  } catch (error) {
    void logError(null, { area: 'db-open', error });
    root.render(
      <StrictMode>
        <RecoveryScreen error={error} />
      </StrictMode>,
    );
    return;
  }

  const rt = runtime;
  watchDatabaseHealth(rt.db, {
    onFailed: () => {
      if (controlledRestart() === 'loop-detected') {
        root.render(
          <StrictMode>
            <RecoveryScreen error={new ConnectionLostError()} />
          </StrictMode>,
        );
      }
    },
    onReopened: () => {
      void logError(rt.db, {
        level: 'warn',
        area: 'db-health',
        error: new Error('Datenbank nach Verbindungsverlust neu geöffnet'),
      });
    },
  });

  const router = createBrowserRouter(routes);
  root.render(
    <StrictMode>
      <App runtime={rt} router={router} />
    </StrictMode>,
  );
}

void start();
