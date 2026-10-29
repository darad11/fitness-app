import { Dumbbell } from 'lucide-react';
import { Suspense, type ComponentProps } from 'react';
import { ExerciseDemo, ExerciseGuideView, ExerciseThumb } from '@/modules/exercises';
import { cn } from '@/shared/lib/cn';

/**
 * Visuals der Übungen im Training (D-397, D-398). Die Komponenten kommen nachgeladen aus dem Modul
 * „exercises“; bis dahin steht hier das Symbol in der Kachel, gleich groß wie das Vorschaubild,
 * damit beim ersten Laden nichts springt. Liegt nur in nachgeladenen Seiten.
 */
function Placeholder({ className, small }: { className?: string; small?: boolean }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-tile bg-surface-2 text-fg',
        small ? 'size-tile' : 'size-thumb',
        className,
      )}
    >
      <Dumbbell aria-hidden="true" className="size-6" />
    </span>
  );
}

export function Thumb(props: ComponentProps<typeof ExerciseThumb>) {
  return (
    <Suspense fallback={<Placeholder className={props.className} small={props.size === 'small'} />}>
      <ExerciseThumb {...props} />
    </Suspense>
  );
}

export function Demo(props: ComponentProps<typeof ExerciseDemo>) {
  return (
    <Suspense
      fallback={props.variant === 'compact' ? <Placeholder className={props.className} /> : null}
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
