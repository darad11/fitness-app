// Öffentliche Schnittstelle des Moduls „shopping“ (Einkaufsliste, D-287).
export { shoppingRoutes } from './routes';
export { useShoppingItems } from './data/useShopping';
export { isOpen as isShoppingItemOpen } from './calc/entry';
export { addLines as addShoppingLines, type ShoppingLine } from './service/shoppingService';
