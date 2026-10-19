import type { RouteObject } from 'react-router';

/** Ernährung (Schritt G): Seiten und der BLS werden erst beim Aufruf geladen. */
export const nutritionRoutes: RouteObject[] = [
  {
    path: 'ernaehrung',
    lazy: async () => ({ Component: (await import('./ui/NutritionPage')).NutritionPage }),
  },
  {
    path: 'ernaehrung/hinzufuegen',
    lazy: async () => ({ Component: (await import('./ui/AddFoodPage')).AddFoodPage }),
  },
  {
    path: 'ernaehrung/lebensmittel',
    lazy: async () => ({ Component: (await import('./ui/FoodsPage')).FoodsPage }),
  },
  {
    path: 'ernaehrung/lebensmittel/neu',
    lazy: async () => ({ Component: (await import('./ui/FoodFormPage')).FoodFormPage }),
  },
  {
    path: 'ernaehrung/lebensmittel/:foodId',
    lazy: async () => ({ Component: (await import('./ui/FoodFormPage')).FoodFormPage }),
  },
  {
    path: 'ernaehrung/rezepte',
    lazy: async () => ({ Component: (await import('./ui/RecipesPage')).RecipesPage }),
  },
  {
    path: 'ernaehrung/rezepte/neu',
    lazy: async () => ({ Component: (await import('./ui/RecipeEditPage')).RecipeEditPage }),
  },
  {
    path: 'ernaehrung/rezepte/:recipeId',
    lazy: async () => ({ Component: (await import('./ui/RecipeEditPage')).RecipeEditPage }),
  },
  {
    path: 'ernaehrung/vorlagen',
    lazy: async () => ({ Component: (await import('./ui/TemplatesPage')).TemplatesPage }),
  },
  {
    path: 'ernaehrung/ziele',
    lazy: async () => ({ Component: (await import('./ui/TargetsPage')).TargetsPage }),
  },
];
