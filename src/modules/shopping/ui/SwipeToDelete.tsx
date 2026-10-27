import { Trash2 } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/shared/lib/cn';
import { releasesDelete, swipeIntent, swipeOffset, type SwipeIntent } from '../calc/swipe';

interface Gesture {
  pointerId: number;
  x: number;
  y: number;
  width: number;
  intent: SwipeIntent;
}

/** Dauer der Bewegung beim Zurückschnappen und Hinausgleiten (ms). */
const SLIDE_MS = 200;

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Zeile, die sich mit einem Wisch nach links löschen lässt (Phase Ernährung §4, D-360). Nur ein
 * klar waagrechter Wisch nach links bewegt die Zeile; senkrecht scrollt der Browser wie gewohnt
 * (`touch-action: pan-y`), schräg, nach rechts oder zu kurz passiert nichts. Hinter der Zeile
 * erscheint dezent „Löschen“; ab der Löschstrecke wird es deutlicher, und Loslassen löscht.
 * Tastatur und Screenreader nutzen weiter den Weg über „Bearbeiten“, deshalb ist die Anzeige
 * hinter der Zeile für sie ausgeblendet.
 *
 * Die Geste wird am Fenster verfolgt, ohne den Zeiger zu fangen (Nachtrag zu D-384): So kommen
 * Bewegung und Loslassen auch an, wenn der Zeiger die Zeile verlässt; ein Finger gehört ohnehin
 * bis zum Loslassen zur Zeile, auf der er aufsetzt. Ziehen und Ablegen des Browsers ist in der
 * Zeile aus: WebKit begann mit der Maus sonst nach dem ersten Schritt ein Ziehen der Zeile, und
 * es kamen keine Zeiger-Ereignisse mehr an.
 */
export function SwipeToDelete({
  label,
  onDelete,
  children,
  className,
}: {
  /** Sichtbare Beschriftung hinter der Zeile, z. B. „Löschen“. */
  label: string;
  /** Löscht den Artikel; schlägt es fehl, gleitet die Zeile zurück. */
  onDelete: () => Promise<void>;
  children: ReactNode;
  /** Klassen für den beweglichen Inhalt der Zeile, z. B. das Flex-Layout. */
  className?: string;
}) {
  const gesture = useRef<Gesture | null>(null);
  /** Entfernt die Zuhörer am Fenster der laufenden Geste. */
  const unfollow = useRef<(() => void) | null>(null);
  const suppressClick = useRef(false);
  const mounted = useRef(true);
  const [offset, setOffset] = useState(0);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      unfollow.current?.();
    };
  }, []);

  const reset = () => {
    unfollow.current?.();
    gesture.current = null;
    setDragging(false);
    setLeaving(false);
    setOffset(0);
  };

  const remove = () => {
    onDelete().catch(() => {
      if (mounted.current) reset();
    });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    suppressClick.current = false;
    if (!event.isPrimary || event.button !== 0 || leaving) return;
    const rowWidth = event.currentTarget.getBoundingClientRect().width;
    gesture.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      width: rowWidth,
      intent: 'pending',
    };
    setWidth(rowWidth);
    unfollow.current?.();
    const pointerId = event.pointerId;
    const onCancel = (cancel: PointerEvent) => {
      if (cancel.pointerId === pointerId) reset();
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onCancel);
    unfollow.current = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onCancel);
      unfollow.current = null;
    };
  };

  const onPointerMove = (event: PointerEvent) => {
    const current = gesture.current;
    if (current?.pointerId !== event.pointerId || current.intent === 'ignore') return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (current.intent === 'pending') {
      current.intent = swipeIntent(dx, dy);
      if (current.intent === 'pending') return;
      // Ab hier ist es eine Geste, kein Tipp: Ein Klick danach (Maus) hakt nicht ab.
      suppressClick.current = true;
      if (current.intent !== 'swipe') return;
      setDragging(true);
    }
    setOffset(swipeOffset(dx, current.width));
  };

  const onPointerUp = (event: PointerEvent) => {
    const current = gesture.current;
    if (current?.pointerId !== event.pointerId) return;
    unfollow.current?.();
    gesture.current = null;
    if (current.intent !== 'swipe') return;
    setDragging(false);
    const dx = event.clientX - current.x;
    const finalOffset = swipeOffset(dx, current.width);
    if (!releasesDelete(finalOffset, current.width)) {
      setOffset(0);
      return;
    }
    if (prefersReducedMotion()) {
      setOffset(-current.width);
      remove();
      return;
    }
    setLeaving(true);
    setOffset(-current.width);
    window.setTimeout(() => {
      if (mounted.current) remove();
    }, SLIDE_MS);
  };

  const armed = offset < 0 && releasesDelete(offset, width);

  return (
    <div
      className="relative overflow-hidden"
      onClickCapture={(event) => {
        // Nach einem Wisch kein Abhaken und kein Öffnen: Der Klick gehört zur Geste.
        if (!suppressClick.current) return;
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {offset < 0 ? (
        <div
          aria-hidden="true"
          data-swipe-action=""
          data-armed={armed ? '' : undefined}
          className={cn(
            'absolute inset-y-0 right-0 flex items-center justify-end gap-2 overflow-hidden pr-3 text-sm font-semibold whitespace-nowrap text-danger',
            armed ? 'bg-danger-soft' : 'opacity-60',
          )}
          style={{ width: -offset }}
        >
          <Trash2 aria-hidden="true" className="size-5 shrink-0" />
          {-offset >= 88 ? <span>{label}</span> : null}
        </div>
      ) : null}
      <div
        data-swipe-row=""
        className={cn(
          'relative touch-pan-y select-none',
          !dragging && 'transition-transform duration-200 ease-out motion-reduce:transition-none',
          className,
        )}
        style={offset !== 0 ? { transform: `translateX(${offset}px)` } : undefined}
        onPointerDown={onPointerDown}
        onDragStart={(event) => {
          event.preventDefault();
        }}
      >
        {children}
      </div>
    </div>
  );
}
