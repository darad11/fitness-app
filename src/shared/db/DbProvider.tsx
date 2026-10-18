import { createContext, use, type ReactNode } from 'react';
import type { DbRuntime } from './runtime';

const DbContext = createContext<DbRuntime | null>(null);

export function DbProvider({ runtime, children }: { runtime: DbRuntime; children: ReactNode }) {
  return <DbContext value={runtime}>{children}</DbContext>;
}

/** Zugriff auf die geöffnete Datenbank innerhalb der App. */
export function useDb(): DbRuntime {
  const runtime = use(DbContext);
  if (!runtime) throw new Error('useDb außerhalb von DbProvider');
  return runtime;
}
