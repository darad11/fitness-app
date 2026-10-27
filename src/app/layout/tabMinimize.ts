import { onPageScroll, pageScrollTop } from '@/shared/ui/pageScroll';

/**
 * Tab-Leiste minimiert sich beim Runterscrollen (D-276), wie im Dashboard des Produktinhabers
 * und wie `tabBarMinimizeBehavior(.onScrollDown)` in iOS 26: Sie schrumpft zu einem Glas-Kreis
 * am rechten Rand, der das Symbol des aktiven Bereichs zeigt; der Inhalt dahinter wird frei.
 * Zurück beim Hochscrollen, ganz oben auf der Seite, per Tipp auf den Kreis (wählt nichts) und
 * wenn die Tastatur in die Leiste kommt. Es zählt nur eigenes Scrollen (Finger, Mausrad,
 * Tasten), nicht Sprünge beim Seitenwechsel.
 */

/** Schwellen (eigene Werte wie im Dashboard): 12 px nach unten bzw. oben, ganz oben ≤ 8 px. */
const STEP = 12;
const TOP = 8;
/** Ein Scrollen zählt, wenn es bis 0,6 s nach Berührung, Mausrad oder Taste kommt. */
const INTENT_MS = 600;
/** Durchmesser des Kreises in px (wie `--tabbar-min` in styles.css). */
const CIRCLE = 56;

export function attachTabMinimize(bar: HTMLElement, wrapper: HTMLElement): () => void {
  // Es zählt das Scrollen der Seite im Rahmen der App, nicht des Fensters (D-384).
  let anchor = pageScrollTop();
  let intentAt = -Infinity;
  let touching = false;

  const measure = () => {
    const items = bar.querySelector<HTMLElement>('.tabbar-items');
    const tab = bar.querySelector<HTMLElement>('.tabbar-tab.active');
    const icon = tab?.querySelector<SVGElement>('svg');
    if (!items || !tab || !icon) return false;
    const barBox = bar.getBoundingClientRect();
    const itemsBox = items.getBoundingClientRect();
    const iconBox = icon.getBoundingClientRect();
    const circle = CIRCLE;
    // Mitte des Symbols in der vollen Leiste, gemessen ab der linken oberen Ecke der Einträge.
    const iconX = iconBox.left + iconBox.width / 2 - itemsBox.left;
    const iconY = iconBox.top + iconBox.height / 2 - itemsBox.top;
    bar.style.setProperty('--items-w', `${String(itemsBox.width)}px`);
    bar.style.setProperty('--items-h', `${String(itemsBox.height)}px`);
    bar.style.setProperty('--icon-dx', `${String(circle / 2 - iconX)}px`);
    bar.style.setProperty('--icon-dy', `${String(circle / 2 - iconY)}px`);
    // Kreismitte am rechten Rand des Bereichs, auf der Mittellinie der vollen Leiste.
    const inner = wrapper.clientWidth - parseFloat(getComputedStyle(wrapper).paddingRight);
    bar.style.setProperty(
      '--min-shift',
      `${String(inner - circle / 2 - (barBox.left - wrapper.getBoundingClientRect().left + barBox.width / 2))}px`,
    );
    return true;
  };

  const minimize = () => {
    if (bar.classList.contains('minimized') || bar.contains(document.activeElement)) return;
    if (!measure()) return;
    bar.classList.add('collapsed', 'minimized');
  };
  const restore = () => {
    if (!bar.classList.contains('minimized')) return;
    bar.classList.remove('minimized');
    const done = () => {
      if (!bar.classList.contains('minimized')) bar.classList.remove('collapsed');
    };
    const animations = bar.getAnimations();
    if (animations.length === 0) done();
    else void Promise.allSettled(animations.map((a) => a.finished)).then(done);
  };

  const onScroll = () => {
    const y = pageScrollTop();
    if (y <= TOP) {
      restore();
      anchor = y;
      return;
    }
    // Hochscrollen klappt immer auf, auch ohne erkannte eigene Bewegung (z. B. Nachschwingen nach
    // dem Loslassen oder eine verspätete Scroll-Meldung in WebKit). Nur das Einklappen verlangt
    // eigenes Scrollen, damit Sprünge der Seite die Leiste nicht verstecken.
    if (anchor - y > STEP) {
      restore();
      anchor = y;
      return;
    }
    const intended = touching || performance.now() - intentAt < INTENT_MS;
    if (!intended) {
      anchor = y;
      return;
    }
    if (y - anchor > STEP) {
      minimize();
      anchor = y;
    } else if (bar.classList.contains('minimized') === y > anchor) {
      // Gleiche Richtung wie der Zustand: Bezugspunkt mitziehen.
      anchor = y;
    }
  };
  const markIntent = () => {
    intentAt = performance.now();
  };
  const onTouchStart = (e: TouchEvent) => {
    if (bar.contains(e.target as Node)) return;
    touching = true;
    markIntent();
  };
  const onTouchEnd = () => {
    touching = false;
    markIntent(); // Nachlaufen des Fingers zählt noch
  };
  const onKey = (e: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) {
      markIntent();
    }
  };
  // Tipp auf den Kreis: nur aufklappen, nichts wählen (vor der Linse, die sonst den Tipp nimmt).
  const swallow = (e: Event) => {
    if (!bar.classList.contains('minimized')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.type === 'pointerdown') restore();
  };
  const onFocusIn = () => {
    restore();
  };
  const onResize = () => {
    if (!bar.classList.contains('minimized')) return;
    bar.classList.add('no-morph');
    bar.classList.remove('minimized', 'collapsed');
    bar.getBoundingClientRect();
    measure();
    bar.classList.add('collapsed', 'minimized');
    bar.getBoundingClientRect();
    bar.classList.remove('no-morph');
  };

  const detachScroll = onPageScroll(onScroll);
  window.addEventListener('wheel', markIntent, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);
  bar.addEventListener('pointerdown', swallow, true);
  bar.addEventListener('click', swallow, true);
  bar.addEventListener('focusin', onFocusIn);
  return () => {
    detachScroll();
    window.removeEventListener('wheel', markIntent);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchEnd);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    bar.removeEventListener('pointerdown', swallow, true);
    bar.removeEventListener('click', swallow, true);
    bar.removeEventListener('focusin', onFocusIn);
  };
}
