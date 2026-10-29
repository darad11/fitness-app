import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { t } from '@/shared/i18n/de';
import { cn } from '@/shared/lib/cn';
import { inSection, VISIBLE_NAV_ITEMS } from './nav';

/** So weit ragt die Auswahl über ihren Eintrag hinaus (CSS: .tabbar-indicator, tabLens.ts). */
const PILL_OUTSET = 4;

function activeKey(pathname: string): string | undefined {
  return VISIBLE_NAV_ITEMS.find(
    (item) =>
      pathname === item.to || pathname.startsWith(`${item.to}/`) || inSection(pathname, item),
  )?.to;
}

/**
 * Tab-Leiste auf iPhone und iPad hoch (unter 1024 px): schwebende Glas-Kapsel mit gleitender
 * Auswahl und Glas-Linse unter dem Finger (D-272, tabLens.ts), beim Runterscrollen ein Kreis rechts
 * (D-276, tabMinimize.ts). Farben der Marke FORM (D-312): getöntes Glas, aktiver Tab in Lime.
 */
export function TabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const bar = useRef<HTMLElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const current = activeKey(pathname);
  const currentRef = useRef(current);
  // Linse und Kreis kommen nachgeladen (D-396); bis dahin ist die Leiste „beschäftigt“, Tippen
  // geht schon wie gewohnt.
  const [effectsReady, setEffectsReady] = useState(false);

  // Auswahl gleitet zum aktiven Eintrag; beim ersten Bild ohne Übergang.
  useLayoutEffect(() => {
    currentRef.current = current;
    const pill = indicator.current;
    const tab = bar.current?.querySelector<HTMLElement>(`.tabbar-tab[data-tab="${current ?? ''}"]`);
    if (!pill) return;
    if (!tab) {
      pill.style.opacity = '0';
      return;
    }
    const place = () => {
      pill.style.width = `${String(tab.offsetWidth + 2 * PILL_OUTSET)}px`;
      pill.style.transform = `translateX(${String(tab.offsetLeft - PILL_OUTSET)}px)`;
      pill.style.opacity = '1';
    };
    if (!pill.dataset.ready) {
      pill.classList.add('no-transition');
      place();
      pill.getBoundingClientRect(); // Layout erzwingen, damit der Sprung ohne Übergang bleibt
      pill.classList.remove('no-transition');
      pill.dataset.ready = '1';
    } else {
      place();
    }
  }, [current]);

  useEffect(() => {
    const node = bar.current;
    if (!node) return;
    // Die Auswahl folgt jeder Größenänderung der Einträge, ohne zu gleiten (D-373). Vorher hing
    // sie am Fenster-Ereignis: Kam das, während die Leiste ein Kreis war (Auf- und Zuklappen beim
    // iPhone Duo), maß sie die alten Breiten und stand nach dem Aufgehen neben dem aktiven Tab.
    const place = () => {
      const pill = indicator.current;
      const tab = node.querySelector<HTMLElement>(
        `.tabbar-tab[data-tab="${currentRef.current ?? ''}"]`,
      );
      if (!pill || !tab) return;
      pill.classList.add('no-transition');
      pill.style.width = `${String(tab.offsetWidth + 2 * PILL_OUTSET)}px`;
      pill.style.transform = `translateX(${String(tab.offsetLeft - PILL_OUTSET)}px)`;
      pill.getBoundingClientRect(); // Layout erzwingen, damit der Sprung ohne Übergang bleibt
      pill.classList.remove('no-transition');
    };
    const items = node.querySelector('.tabbar-items');
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null;
    if (items) observer?.observe(items);
    if (!observer) window.addEventListener('resize', place);
    // Linse und Kreis nachgeladen (D-396): Sie liegen nicht in der Startansicht. Vor der Linse
    // anmelden: Ein Tipp auf den Kreis klappt nur auf.
    let detach: (() => void) | undefined;
    let cancelled = false;
    void Promise.all([import('./tabMinimize'), import('./tabLens')])
      .then(([minimize, lens]) => {
        if (cancelled) return;
        const detachMinimize = wrapper.current
          ? minimize.attachTabMinimize(node, wrapper.current)
          : undefined;
        const detachLens = lens.attachTabLens(node, {
          active: () => currentRef.current,
          select: (key) => {
            void navigate(key);
          },
        });
        detach = () => {
          detachLens();
          detachMinimize?.();
        };
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setEffectsReady(true);
      });
    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener('resize', place);
      detach?.();
    };
  }, [navigate]);

  return (
    // Seitlich mindestens der sichere Bereich (D-372): Beim iPhone Duo liegen Statusleiste und
    // Kamera an der Seite; Leiste und Kreis bleiben daneben und damit antippbar. Bei offener
    // Bildschirmtastatur ist beides aus (`tabbar-dock` in styles.css, D-391).
    <div
      ref={wrapper}
      className="tabbar-dock pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-20 flex justify-center pr-[max(0.75rem,env(safe-area-inset-right))] pl-[max(0.75rem,env(safe-area-inset-left))] lg:hidden"
    >
      <nav
        ref={bar}
        aria-label={t.nav.label}
        aria-busy={effectsReady ? undefined : true}
        className="tabbar pointer-events-auto"
      >
        <span ref={indicator} aria-hidden="true" className="tabbar-indicator" />
        <ul className="tabbar-items">
          {VISIBLE_NAV_ITEMS.map((item) => {
            const { to, label, icon: Icon } = item;
            const selected = to === current;
            return (
              <li key={to} className="flex min-w-0 flex-1">
                <NavLink to={to} data-tab={to} className={cn('tabbar-tab', selected && 'active')}>
                  <Icon aria-hidden="true" className="size-6" />
                  <span className="tabbar-label">{label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
