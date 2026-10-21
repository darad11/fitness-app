import type { RouteObject } from 'react-router';

/** Einkaufsliste in „Meine Küche“ (D-287); erst beim Aufruf geladen. */
export const shoppingRoutes: RouteObject[] = [
  {
    path: 'ernaehrung/einkaufsliste',
    lazy: async () => ({ Component: (await import('./ui/ShoppingListPage')).ShoppingListPage }),
  },
];
