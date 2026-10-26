/**
 * Die Seite scrollt in einem eigenen Rahmen, nicht im Fenster (D-384).
 *
 * Feste und klebende Elemente hängen beim Scrollen des Fensters am Layout-Viewport des Browsers.
 * Am iPhone Duo blieb er beim Scrollen stehen: Tab-Leiste, Kreis und Fußleiste lagen mitten im
 * Inhalt, der Kopf im Training scrollte weg, erst danach sprang alles zurück. Im Rahmen scrollt
 * nur der Inhalt; das Fenster steht still, und die Leisten außerhalb des Rahmens müssen beim
 * Scrollen von niemandem nachgeführt werden, auch nicht vom Browser.
 *
 * Ohne Rahmen (Fehleransichten außerhalb des App-Rahmens, Tests ohne Layout) gilt das Dokument.
 */
export const PAGE_SCROLLER_ID = 'seite';

/** Der Rahmen, der die Seite scrollt; ohne ihn das Dokument. */
export function pageScroller(doc: Document = document): HTMLElement {
  return (
    doc.getElementById(PAGE_SCROLLER_ID) ??
    (doc.scrollingElement as HTMLElement | null) ??
    doc.documentElement
  );
}

/** Scrollposition der Seite in px. */
export function pageScrollTop(): number {
  return pageScroller().scrollTop;
}

/** Sichtbare Höhe der Seite in px: Höhe des Rahmens, ohne ihn die Fensterhöhe. */
export function pageViewportHeight(): number {
  return pageScroller().clientHeight || window.innerHeight;
}

/** Scrollt die Seite um `top` px. */
export function scrollPageBy(top: number, behavior: ScrollBehavior = 'instant'): void {
  pageScroller().scrollBy({ top, behavior });
}

/** Scrollt die Seite an die Stelle `top`. */
export function scrollPageTo(top: number, behavior: ScrollBehavior = 'instant'): void {
  pageScroller().scrollTo({ top, behavior });
}

/**
 * Hört auf das Scrollen der Seite. Ein Rahmen meldet es selbst (das Ereignis steigt nicht zum
 * Fenster auf), das Dokument über das Fenster. Gibt die Abmeldung zurück.
 */
export function onPageScroll(listener: () => void): () => void {
  const target: EventTarget = document.getElementById(PAGE_SCROLLER_ID) ?? window;
  target.addEventListener('scroll', listener, { passive: true });
  return () => {
    target.removeEventListener('scroll', listener);
  };
}

/** Zahl der Seiten, die ihre Lage beim Größenwechsel gerade selbst halten. */
let ownPositionHolders = 0;

/**
 * Eine Seite hält ihre Lage beim Größenwechsel selbst, z. B. der Player den aktiven Satz
 * (Nachtrag zu D-384): Der `ScrollManager` gleicht dann nicht aus, und die Scroll-Verankerung des
 * Browsers ist im Rahmen aus. So scrollt nach dem Auf- und Zuklappen nur eine Stelle, nicht
 * mehrere gegeneinander. Gibt die Freigabe zurück.
 */
export function holdOwnPosition(doc: Document = document): () => void {
  ownPositionHolders += 1;
  const frame = doc.getElementById(PAGE_SCROLLER_ID);
  frame?.style.setProperty('overflow-anchor', 'none');
  let released = false;
  return () => {
    if (released) return;
    released = true;
    ownPositionHolders -= 1;
    if (ownPositionHolders === 0) frame?.style.removeProperty('overflow-anchor');
  };
}

/** Hält gerade eine Seite ihre Lage selbst (`holdOwnPosition`)? */
export function ownPositionHeld(): boolean {
  return ownPositionHolders > 0;
}
