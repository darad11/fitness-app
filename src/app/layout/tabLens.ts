/**
 * Glas-Linse der Tab-Leiste (D-272), nach dem Vorbild der iOS-26-Tab-Leiste und der Umsetzung im
 * Dashboard des Produktinhabers: Ein Finger auf der Leiste hebt die Auswahl als klare Linse an.
 * Sie folgt dem Finger, vergrößert die Symbole darunter, bricht sie am Rand in Farben auf und legt
 * sich beim Loslassen auf den nächsten Bereich. Ein Tippen wählt weiter über den Link (wie Tastatur
 * und VoiceOver); ein Ziehen wählt beim Loslassen. Die Linse zeigt Kopien der Einträge
 * (aria-hidden); die echten Einträge bekommen ein Loch in Linsenform, damit nichts doppelt
 * erscheint. Federn werden je Bild gerechnet; mit „Bewegung reduzieren“ ohne Überschwingen,
 * Dehnen und Anschwellen, mit „Transparenz reduzieren“ ohne durchsichtigen Rand.
 */

const LENS = {
  grow: 1.22, // angehobene Linse: 1,22 × so breit wie die Auswahl …
  overhang: 3.5, // … und 3,5 px höher als die Leiste oben und unten
  magnify: 0.15, // Symbole unter der Linse: 1,15 ×
  rimWidth: 0.1, // Rand: 10 % der Linsenhöhe; Symbole darin …
  rimShrink: 0.08, // … 0,92 × …
  dispersion: 0.045, // … mit 4,5 % Abstand der Farbkanäle
  swell: 14, // die Leiste wird beim Berühren rund 14 px breiter
  slop: 8, // so viele px, bis eine Berührung als Ziehen gilt
};

/** [Antwortzeit (s), Dämpfung] wie SwiftUI spring(response:dampingFraction:). */
type Spring = readonly [number, number];
const SPRINGS = {
  lead: [0.12, 0.82],
  trail: [0.22, 0.86],
  dragLead: [0.07, 0.9],
  dragTrail: [0.14, 0.9],
  rest: [0.18, 0.82],
  lift: [0.16, 0.7],
  drop: [0.2, 0.9],
  reduced: [0.12, 1],
} as const satisfies Record<string, Spring>;
const SPRING_STEP = 1 / 240;
/** So weit ragt die Auswahl über ihren Eintrag hinaus (CSS: .tabbar-indicator). */
export const PILL_OUTSET = 4;

interface State {
  x: number;
  v: number;
}

interface TabGeo {
  key: string;
  center: number;
  width: number;
}

interface Geo {
  tabs: TabGeo[];
  first: TabGeo;
  last: TabGeo;
  width: number;
  height: number;
  borderLeft: number;
  cy: number;
  outerWidth: number;
  outerHeight: number;
  pillW: number;
  pillH: number;
  lensW: number;
  lensH: number;
  items: { left: number; top: number; width: number; height: number };
}

interface View {
  node: HTMLElement;
  channel: 'r' | 'g' | 'b' | null;
}

export interface LensOptions {
  /** Schlüssel des aktiven Bereichs (data-tab des Eintrags). */
  active: () => string | undefined;
  /** Nach dem Ziehen: Bereich wählen. */
  select: (key: string) => void;
}

function springTo(state: State, target: number, spec: Spring, dt: number) {
  const stiffness = ((2 * Math.PI) / spec[0]) ** 2;
  const damping = (4 * Math.PI * spec[1]) / spec[0];
  state.v += (stiffness * (target - state.x) - damping * state.v) * dt;
  state.x += state.v * dt;
}

function el(tag: string, className: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

function media(query: string): { matches: boolean } {
  return typeof window.matchMedia === 'function' ? window.matchMedia(query) : { matches: false };
}

/**
 * Baut die Linse in die Leiste `bar` (mit `.tabbar-items` und Einträgen `.tabbar-tab[data-tab]`)
 * und gibt eine Aufräumfunktion zurück.
 */
export function attachTabLens(bar: HTMLElement, options: LensOptions): () => void {
  const itemsNode = bar.querySelector<HTMLElement>('.tabbar-items');
  if (!itemsNode || typeof window.requestAnimationFrame !== 'function') return () => undefined;
  const items: HTMLElement = itemsNode;
  const reducedMotion = media('(prefers-reduced-motion: reduce)');
  const reducedTransparency = media('(prefers-reduced-transparency: reduce)');

  const glow = el('span', 'tabbar-glow');
  glow.setAttribute('aria-hidden', 'true');
  bar.insertBefore(glow, items);

  function lensCopy(channel: View['channel']): HTMLElement {
    const view = el('span', channel ? `tabbar-lens-view channel-${channel}` : 'tabbar-lens-view');
    if (channel) view.append(el('span', 'tabbar-lens-page'), el('span', 'tabbar-lens-edge'));
    const copy = el('span', 'tabbar-items-copy');
    items.querySelectorAll<HTMLElement>('.tabbar-tab').forEach((tab) => {
      const item = el('span', 'tabbar-lens-tab');
      item.dataset.tab = tab.dataset.tab;
      tab.childNodes.forEach((n) => item.appendChild(n.cloneNode(true)));
      copy.appendChild(item);
    });
    view.appendChild(copy);
    return view;
  }

  const node = el('span', 'tabbar-lens');
  node.setAttribute('aria-hidden', 'true');
  const ring = el('span', 'tabbar-lens-ring');
  const core = el('span', 'tabbar-lens-core');
  const views: View[] = (['r', 'g', 'b'] as const).map((channel) => ({
    node: ring.appendChild(lensCopy(channel)),
    channel,
  }));
  views.push({ node: core.appendChild(lensCopy(null)), channel: null });
  node.append(
    el('span', 'tabbar-lens-pill'),
    el('span', 'tabbar-lens-fill'),
    ring,
    core,
    el('span', 'tabbar-lens-rim'),
  );
  bar.appendChild(node);
  bar.classList.add('lens-ready');

  let geo: Geo | null = null;
  let active = false;
  let pressed = false;
  let dragging = false;
  let dropping = false;
  let pointerId: number | null = null;
  let startX = 0;
  let fingerX = 0;
  let touched: string | undefined;
  let pendingTap: string | undefined;
  let pendingTimer: ReturnType<typeof setTimeout> | undefined;
  let suppressClick = false;
  let suppressTimer: ReturnType<typeof setTimeout> | undefined;
  let left: State = { x: 0, v: 0 };
  let right: State = { x: 0, v: 0 };
  let lift: State = { x: 0, v: 0 };
  let scale = 1;
  let releasedAt = 0;
  let frame = 0;
  let last = 0;
  let candidate: string | undefined;

  function measure(): Geo | null {
    const box = bar.getBoundingClientRect();
    if (!box.width) return null;
    const style = getComputedStyle(bar);
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    const borderTop = parseFloat(style.borderTopWidth) || 0;
    const x = (v: number) => (v - box.left) / scale - borderLeft;
    const y = (v: number) => (v - box.top) / scale - borderTop;
    const tabs: TabGeo[] = [];
    items.querySelectorAll<HTMLElement>('.tabbar-tab').forEach((tab) => {
      const r = tab.getBoundingClientRect();
      if (r.width && tab.dataset.tab) {
        tabs.push({
          key: tab.dataset.tab,
          center: x(r.left + r.width / 2),
          width: r.width / scale,
        });
      }
    });
    const first = tabs[0];
    const lastTab = tabs[tabs.length - 1];
    if (!first || !lastTab) return null;
    const itemsBox = items.getBoundingClientRect();
    const height = box.height / scale - borderTop - (parseFloat(style.borderBottomWidth) || 0);
    const width = box.width / scale - borderLeft - (parseFloat(style.borderRightWidth) || 0);
    const indicator = bar.querySelector<HTMLElement>('.tabbar-indicator');
    const pillW = first.width + 2 * PILL_OUTSET;
    const measured: Geo = {
      tabs,
      first,
      last: lastTab,
      width,
      height,
      borderLeft,
      cy: height / 2,
      outerWidth: box.width / scale,
      outerHeight: box.height / scale,
      pillW,
      pillH: indicator && indicator.offsetHeight > 0 ? indicator.offsetHeight : height - 8,
      lensW: pillW * LENS.grow,
      lensH: height + 2 * LENS.overhang,
      items: {
        left: x(itemsBox.left),
        top: y(itemsBox.top),
        width: itemsBox.width / scale,
        height: itemsBox.height / scale,
      },
    };
    const place = (n: HTMLElement, l: number, t: number, w: number, h: number) => {
      n.style.left = `${String(l)}px`;
      n.style.top = `${String(t)}px`;
      n.style.width = `${String(w)}px`;
      n.style.height = `${String(h)}px`;
    };
    views.forEach((v) => {
      const copy = v.node.querySelector<HTMLElement>('.tabbar-items-copy');
      if (copy) {
        place(
          copy,
          measured.items.left,
          measured.items.top,
          measured.items.width,
          measured.items.height,
        );
      }
      v.node.querySelectorAll<HTMLElement>('.tabbar-lens-page, .tabbar-lens-edge').forEach((n) => {
        place(n, -borderLeft, -borderTop, measured.outerWidth, measured.outerHeight);
      });
    });
    return measured;
  }

  function tabOf(g: Geo, key: string | undefined): TabGeo {
    return g.tabs.find((t) => t.key === key) ?? g.first;
  }

  function nearest(g: Geo, x: number): TabGeo {
    return g.tabs.reduce((best, t) =>
      Math.abs(t.center - x) < Math.abs(best.center - x) ? t : best,
    );
  }

  /** Linsenmitte für eine Fingerposition: über den Einträgen, an den Enden etwas nachgiebig. */
  function dragCenter(g: Geo, x: number): number {
    const first = g.first.center;
    const lastCenter = g.last.center;
    const give = (d: number) => (18 * d) / (d + 54);
    if (x < first) return first - give(first - x);
    if (x > lastCenter) return lastCenter + give(x - lastCenter);
    return x;
  }

  function target(g: Geo): number {
    if (pressed) return dragging ? dragCenter(g, fingerX) : tabOf(g, touched).center;
    return tabOf(g, pendingTap ?? options.active()).center;
  }

  function render(g: Geo) {
    const lifting = Math.max(0, lift.x);
    const lifted = Math.min(lifting, 1);
    const l = left.x;
    const width = Math.max(1, right.x - l);
    const center = l + width / 2;
    const stretch = reducedMotion.matches
      ? 0
      : Math.min(Math.max(width / (g.pillW + (g.lensW - g.pillW) * lifted) - 1, -0.3), 0.6);
    const height = (g.pillH + (g.lensH - g.pillH) * lifting) * (1 - 0.18 * stretch);
    const top = g.cy - height / 2;
    const rim = reducedTransparency.matches ? 0 : height * LENS.rimWidth * lifted;
    bar.style.setProperty('--lift', lifted.toFixed(4));
    scale = reducedMotion.matches ? 1 : 1 + (LENS.swell / g.width) * lifting;
    bar.style.transform = scale === 1 ? '' : `scale(${String(scale)})`;
    const s = node.style;
    s.width = `${String(width)}px`;
    s.height = `${String(height)}px`;
    s.transform = `translate(${String(l)}px, ${String(top)}px)`;
    s.setProperty('--lw', `${String(width)}px`);
    s.setProperty('--lh', `${String(height)}px`);
    s.setProperty('--rw', `${String(rim)}px`);
    const magnify = 1 + LENS.magnify * lifting;
    const shrink = 1 - LENS.rimShrink * lifted;
    const spread = LENS.dispersion * lifted;
    views.forEach((v) => {
      const k = !v.channel
        ? magnify
        : shrink + (v.channel === 'r' ? -spread : v.channel === 'b' ? spread : 0);
      const cx = v.channel ? width / 2 : width / 2 - rim;
      const cy = v.channel ? height / 2 : height / 2 - rim;
      v.node.style.transform = `translate(${String(cx - k * center)}px, ${String(cy - k * g.cy)}px) scale(${String(k)})`;
    });
    const is = items.style;
    is.setProperty('--hole-x', `${String(l - g.items.left)}px`);
    is.setProperty('--hole-y', `${String(top - g.items.top)}px`);
    is.setProperty('--hole-w', `${String(width)}px`);
    is.setProperty('--hole-h', `${String(height)}px`);
    glow.style.setProperty('--glow-x', `${String(pressed ? fingerX : center)}px`);
    const next = dragging
      ? nearest(g, center).key
      : pressed
        ? touched
        : (pendingTap ?? options.active());
    if (next !== candidate) {
      candidate = next;
      node.querySelectorAll<HTMLElement>('.tabbar-lens-core .tabbar-lens-tab').forEach((t) => {
        t.classList.toggle('candidate', t.dataset.tab === next);
      });
    }
  }

  function step(now: number) {
    frame = 0;
    const g = geo;
    if (!active || !g) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const reduced = reducedMotion.matches;
    const goal = target(g);
    const current = (left.x + right.x) / 2;
    // Nach dem Loslassen bleibt die Linse oben, bis sie (fast) angekommen ist.
    if (!pressed && !dropping && (Math.abs(goal - current) < 2 || now - releasedAt > 160)) {
      dropping = true;
    }
    const liftGoal = dropping ? 0 : 1;
    const half = (g.pillW + (g.lensW - g.pillW) * Math.min(Math.max(lift.x, 0), 1)) / 2;
    const toward = goal - current;
    const leads = dragging ? SPRINGS.dragLead : SPRINGS.lead;
    const trails = dragging ? SPRINGS.dragTrail : SPRINGS.trail;
    const edge = (side: number): Spring =>
      reduced
        ? SPRINGS.reduced
        : Math.abs(toward) < 2
          ? SPRINGS.rest
          : side * toward > 0
            ? leads
            : trails;
    const leftSpring = edge(-1);
    const rightSpring = edge(1);
    const liftSpring: Spring = reduced
      ? SPRINGS.reduced
      : liftGoal > lift.x
        ? SPRINGS.lift
        : SPRINGS.drop;
    for (let t = dt; t > 0; t -= SPRING_STEP) {
      const h = Math.min(SPRING_STEP, t);
      springTo(left, goal - half, leftSpring, h);
      springTo(right, goal + half, rightSpring, h);
      springTo(lift, liftGoal, liftSpring, h);
    }
    render(g);
    const settled =
      dropping &&
      Math.abs(lift.x) < 0.002 &&
      Math.abs(lift.v) < 0.02 &&
      Math.abs(left.x - (goal - half)) < 0.2 &&
      Math.abs(right.x - (goal + half)) < 0.2 &&
      Math.abs(left.v) < 4 &&
      Math.abs(right.v) < 4;
    if (settled) end();
    else frame = window.requestAnimationFrame(step);
  }

  function start(g: Geo) {
    if (!active) {
      const home = tabOf(g, options.active());
      left = { x: home.center - g.pillW / 2, v: 0 };
      right = { x: home.center + g.pillW / 2, v: 0 };
      lift = { x: 0, v: 0 };
      candidate = undefined;
      active = true;
      render(g);
      bar.classList.remove('lens-settling');
      bar.classList.add('lens-active');
    }
    if (!frame) {
      last = performance.now();
      frame = window.requestAnimationFrame(step);
    }
  }

  function end() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    pressed = false;
    dragging = false;
    if (!active) return;
    active = false;
    dropping = false;
    bar.classList.add('lens-settling');
    bar.classList.remove('lens-active');
    bar.style.removeProperty('transform');
    bar.style.removeProperty('--lift');
    scale = 1;
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => {
        if (!active) bar.classList.remove('lens-settling');
      }),
    );
  }

  function xOf(e: PointerEvent, g: Geo): number {
    return (e.clientX - bar.getBoundingClientRect().left) / scale - g.borderLeft;
  }

  const onDown = (e: PointerEvent) => {
    if (pressed || !e.isPrimary || e.button !== 0) return;
    geo = geo ?? measure();
    if (!geo) return;
    clearTimeout(pendingTimer);
    clearTimeout(suppressTimer);
    pendingTap = undefined;
    suppressClick = false;
    const tab = (e.target as Element | null)?.closest<HTMLElement>('.tabbar-tab');
    pressed = true;
    dragging = false;
    dropping = false;
    pointerId = e.pointerId;
    startX = fingerX = xOf(e, geo);
    touched = tab?.dataset.tab ?? nearest(geo, fingerX).key;
    start(geo);
  };

  const onMove = (e: PointerEvent) => {
    if (!pressed || e.pointerId !== pointerId || !geo) return;
    fingerX = xOf(e, geo);
    if (!dragging && Math.abs(fingerX - startX) > LENS.slop) {
      dragging = true;
      try {
        bar.setPointerCapture(e.pointerId);
      } catch {
        // Zeiger schon weg
      }
    }
  };

  const onUp = (e: PointerEvent) => {
    if (!pressed || e.pointerId !== pointerId || !geo) return;
    fingerX = xOf(e, geo);
    pressed = false;
    releasedAt = performance.now();
    if (dragging) {
      dragging = false;
      // Ziehen wählt beim Loslassen; ein danach noch gesendeter Klick zählt nicht doppelt.
      suppressClick = true;
      suppressTimer = setTimeout(() => {
        suppressClick = false;
      }, 500);
      const key = nearest(geo, dragCenter(geo, fingerX)).key;
      if (key !== options.active()) options.select(key);
    } else {
      pendingTap = touched;
      pendingTimer = setTimeout(() => {
        pendingTap = undefined;
      }, 400);
    }
  };

  const onCancel = (e?: PointerEvent) => {
    if (!pressed || (e && e.pointerId !== pointerId)) return;
    pressed = false;
    dragging = false;
    releasedAt = performance.now();
  };

  const onLostCapture = (e: PointerEvent) => {
    if (e.target === bar) onCancel(e);
  };
  const onClick = (e: MouseEvent) => {
    if (suppressClick) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const onContextMenu = (e: Event) => {
    if (pressed) e.preventDefault();
  };
  const onBlur = () => {
    onCancel();
  };
  const onVisibility = () => {
    if (document.hidden) end();
  };
  const onResize = () => {
    geo = null;
    end();
  };

  bar.addEventListener('pointerdown', onDown);
  bar.addEventListener('pointermove', onMove);
  bar.addEventListener('pointerup', onUp);
  bar.addEventListener('pointercancel', onCancel);
  bar.addEventListener('lostpointercapture', onLostCapture);
  bar.addEventListener('click', onClick, true);
  bar.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('blur', onBlur);
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    end();
    clearTimeout(pendingTimer);
    clearTimeout(suppressTimer);
    bar.removeEventListener('pointerdown', onDown);
    bar.removeEventListener('pointermove', onMove);
    bar.removeEventListener('pointerup', onUp);
    bar.removeEventListener('pointercancel', onCancel);
    bar.removeEventListener('lostpointercapture', onLostCapture);
    bar.removeEventListener('click', onClick, true);
    bar.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    glow.remove();
    node.remove();
    bar.classList.remove('lens-ready', 'lens-active', 'lens-settling');
  };
}
