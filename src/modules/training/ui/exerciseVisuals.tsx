import { Dumbbell } from 'lucide-react';
import { Suspense, type ComponentProps } from 'react';
import { ExerciseDemo, ExerciseGuideView, ExerciseThumb } from '@/modules/exercises';
import { cn } from '@/shared/lib/cn';

/**
 * Visuals der Übungen im Training (D-397, D-398). Die Komponenten kommen nachgeladen aus dem Modul
 * „exercises“; bis dahin steht hier das Symbol in der Kachel, gleich groß wie das Vorschaubild,
 * damit beim ersten Laden nichts springt. Liegt nur in nachgeladenen Seiten.
 */
const SIZES = {
  list: 'size-thumb',
  small: 'size-tile',
  mini: 'size-8',
  // Kompakte Demonstration in „Jetzt“: 7 rem breit im Seitenverhältnis der Schleifen (D-498).
  compact: 'w-28 aspect-[4/3]',
} as const;

function Placeholder({
  className,
  size = 'list',
}: {
  className?: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-tile bg-surface-2 text-fg',
        SIZES[size],
        className,
      )}
    >
      <Dumbbell aria-hidden="true" className={size === 'mini' ? 'size-4' : 'size-6'} />
    </span>
  );
}

export function Thumb(props: ComponentProps<typeof ExerciseThumb>) {
  return (
    <Suspense fallback={<Placeholder className={props.className} size={props.size} />}>
      <ExerciseThumb {...props} />
    </Suspense>
  );
}

export function Demo(props: ComponentProps<typeof ExerciseDemo>) {
  return (
    <Suspense
      fallback={
        props.variant === 'compact' ? (
          <Placeholder className={props.className} size="compact" />
        ) : null
      }
    >
      <ExerciseDemo {...props} />
    </Suspense>
  );
}

export function Guide(props: ComponentProps<typeof ExerciseGuideView>) {
  return (
    <Suspense fallback={null}>
      <ExerciseGuideView {...props} />
    </Suspense>
  );
}
