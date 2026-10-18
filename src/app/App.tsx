import type { DataRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { DbProvider, type DbRuntime } from '@/shared/db';

export function App({ runtime, router }: { runtime: DbRuntime; router: DataRouter }) {
  return (
    <DbProvider runtime={runtime}>
      <RouterProvider router={router} />
    </DbProvider>
  );
}
