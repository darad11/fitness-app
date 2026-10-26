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
 * (Nachtrag zu D-384): Der `ScrollManager` gleicht dann die Leseposition nicht aus. So scrollt
 * nach dem Auf- und Zuklappen nur eine Stelle, nicht mehrere gegeneinander. Gibt die Freigabe
 * zurück.
 */
export function holdOwnPosition(): () => void {
  ownPositionHolders += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    ownPositionHolders -= 1;
  };
}

/** Hält gerade eine Seite ihre Lage selbst (`holdOwnPosition`)? */
export function ownPositionHeld(): boolean {
  return ownPositionHolders > 0;
}

/**
 * Felder, an denen am Touch-Gerät die Bildschirmtastatur (oder die Auswahl von iOS) aufgeht
 * (D-391). Dieselbe Liste steht in `styles.css` für Tab-Leiste und Kreis.
 */
export const TEXT_ENTRY_SELECTOR =
  'input:not([type="checkbox"], [type="radio"], [type="range"], [type="button"], [type="submit"], [type="reset"], [type="color"], [type="file"], [type="image"], [type="hidden"]), textarea, select, [contenteditable]:not([contenteditable="false"])';

/** Öffnet dieses Element am Touch-Gerät eine Tastatur? */
export function isTextEntry(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element.matches(TEXT_ENTRY_SELECTOR);
}

/** Touch-Gerät ohne Maus: Dort öffnet ein Feld die Bildschirmtastatur. */
export function touchScreen(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Tippt der Nutzer am Touch-Gerät gerade in ein Feld, ist also die Tastatur offen (D-391)? Ändert
 * sich dann nur die Höhe des Fensters, kommt das von der Tastatur; die App gleicht es nicht aus.
 */
export function typing(doc: Document = document): boolean {
  return touchScreen() && isTextEntry(doc.activeElement);
}

/**
 * Bis zu diesem Anteil der Höhe des Rahmens bleibt ein Feld über der Tastatur zu sehen. Annahme:
 * Die Tastatur nimmt samt Leiste darüber höchstens 60 % der Höhe (am Duo zugeklappt 54 %, Bild B
 * vom zweiten Gerätetest).
 */
const KEYBOARD_FREE = 0.4;

/**
 * Bereich, in dem ein Feld nach oben kommt: der Rahmen der Seite oder ein Dialog über den ganzen
 * Bildschirm (Anmeldung). Blätter, die unten andocken, schiebt iOS mit der Tastatur nach oben;
 * dort bewegt die App nichts.
 */
function revealScroller(field: HTMLElement, doc: Document): HTMLElement | null {
  const view = doc.defaultView ?? window;
  const dialog = field.closest('dialog');
  if (dialog) return dialog.clientHeight >= view.innerHeight * 0.9 ? dialog : null;
  const frame = pageScroller(doc);
  return frame.id === PAGE_SCROLLER_ID && frame.contains(field) ? frame : null;
}

/**
 * Platz unten im Rahmen oder Dialog (`::after` in styles.css), damit auch ein Feld am Ende einer
 * Seite nach oben kommen kann (D-391).
 */
const ROOM = '--tastatur-platz';

/** Leisten, die beim Tippen stehen bleiben (Training), in px am Rahmen: oben und über der Tastatur. */
const BAR_TOP = '--tastatur-oben';
const BAR_BOTTOM = '--tastatur-unten';

const setPx = (frame: HTMLElement, name: string, value: number) => {
  if (value > 0) frame.style.setProperty(name, `${String(Math.ceil(value))}px`);
  else frame.style.removeProperty(name);
};

/**
 * Leisten, die bei offener Tastatur stehen bleiben (D-391): oben der klebende Kopf im Training
 * (`top`, mit Abstand), unten die Fußleiste über der Tastatur (`bottom`). Ein angetipptes Feld
 * kommt unter die obere und, wenn es geht, über die untere. Gilt statt `scroll-padding-top`, das
 * zusammen mit dem `scroll-margin-top` der Satzzeilen sonst doppelt zählte. `0` nimmt die Angabe
 * zurück.
 */
export function setKeyboardBars(top: number, bottom: number, doc: Document = document): void {
  const frame = pageScroller(doc);
  setPx(frame, BAR_TOP, top);
  setPx(frame, BAR_BOTTOM, bottom);
}

const pxOf = (frame: HTMLElement, name: string) =>
  parseFloat(frame.style.getPropertyValue(name)) || 0;

const roomOf = (scroller: HTMLElement) => parseFloat(scroller.style.getPropertyValue(ROOM)) || 0;

/** Bereiche, die Platz unten haben und ihn beim Zurückscrollen wieder abgeben. */
const roomy = new WeakSet<HTMLElement>();

/**
 * Gibt den Platz unten so weit ab, wie er nicht mehr zu sehen ist: Die Lage auf der Seite ändert
 * sich dabei nie, auch nicht beim Schließen der Tastatur. Vorher verschwand der Platz mit dem
 * Fokus und verschob den Inhalt unter dem Finger, sodass ein Tipp daneben ging.
 */
function shrinkRoom(scroller: HTMLElement): void {
  const room = roomOf(scroller);
  if (room <= 0) return;
  const content = scroller.scrollHeight - room;
  const needed = Math.max(0, Math.ceil(scroller.scrollTop + scroller.clientHeight - content));
  if (needed >= room) return;
  if (needed > 0) scroller.style.setProperty(ROOM, `${String(needed)}px`);
  else scroller.style.removeProperty(ROOM);
}

/** Macht unten so viel Platz, dass der Bereich noch um `delta` nach unten scrollen kann. */
function makeRoom(scroller: HTMLElement, delta: number): void {
  const left = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
  if (delta <= left) return;
  scroller.style.setProperty(ROOM, `${String(Math.ceil(roomOf(scroller) + delta - left))}px`);
  if (roomy.has(scroller)) return;
  roomy.add(scroller);
  scroller.addEventListener(
    'scroll',
    () => {
      shrinkRoom(scroller);
    },
    { passive: true },
  );
}

/** Nimmt den Platz unten im Rahmen ganz weg, beim Wechsel der Seite. */
export function releaseRoom(doc: Document = document): void {
  pageScroller(doc).style.removeProperty(ROOM);
}

/**
 * Zeigt ein angetipptes Feld im oberen Teil des Rahmens (D-391), bevor die Tastatur aufgeht: unter
 * dem Abstand oben (`scroll-padding-top` des Rahmens, im Training der Kopf, `setKeyboardBars`)
 * und über der Linie bei 40 % der Höhe, abzüglich einer Leiste, die über der Tastatur bleibt
 * (Fußleiste im Training). Liegt es schon dort oder so hoch wie möglich, bewegt sich nichts; sonst
 * genau ein Schritt ohne Animation, das Feld steht danach unter dem Abstand oben plus seinem
 * `scroll-margin-top` (Platz für die Beschriftung). Reicht die Seite darunter nicht, entsteht
 * unten Platz. iOS muss die Seite so nicht selbst zum Feld schieben; vermutlich kam daher am Duo
 * das Springen bis zum Seitenanfang und zurück. Ebenso in einem Dialog über den ganzen
 * Bildschirm; Blätter bleiben, wie sie sind.
 */
export function revealField(field: HTMLElement, doc: Document = document): void {
  const frame = revealScroller(field, doc);
  if (!frame) return;
  const rect = field.getBoundingClientRect();
  if (rect.height === 0) return;
  const view = doc.defaultView ?? window;
  const box = frame.getBoundingClientRect();
  const padding = parseFloat(view.getComputedStyle(frame).scrollPaddingTop) || 0;
  const top = box.top + (pxOf(frame, BAR_TOP) || padding);
  const highest = top + (parseFloat(view.getComputedStyle(field).scrollMarginTop) || 0);
  const line = box.top + frame.clientHeight * KEYBOARD_FREE - pxOf(frame, BAR_BOTTOM);
  if (rect.top >= top - 1 && (rect.bottom <= line + 1 || rect.top <= highest + 1)) return;
  const delta = rect.top - highest;
  if (Math.abs(delta) < 1) return;
  if (delta > 0) makeRoom(frame, delta);
  frame.scrollBy({ top: delta, behavior: 'instant' });
}

/** Zahl der Stellen, die die Scroll-Verankerung gerade ausgesetzt haben. */
let anchoringSuspensions = 0;

/**
 * Setzt die Scroll-Verankerung des Browsers im Rahmen aus (`overflow-anchor: none`), solange
 * die App die Lage selbst nachführt: beim Zurückgehen und kurz nach einem Größenwechsel im
 * Training. Sonst arbeitet die Verankerung gegen den Ausgleich (WebKit, Nachtrag zu D-384). Gibt
 * die Rückgabe zurück; die Verankerung kommt wieder, wenn alle Stellen fertig sind.
 */
export function suspendScrollAnchoring(doc: Document = document): () => void {
  anchoringSuspensions += 1;
  const frame = pageScroller(doc);
  frame.style.setProperty('overflow-anchor', 'none');
  let resumed = false;
  return () => {
    if (resumed) return;
    resumed = true;
    anchoringSuspensions -= 1;
    if (anchoringSuspensions === 0) frame.style.removeProperty('overflow-anchor');
  };
}
