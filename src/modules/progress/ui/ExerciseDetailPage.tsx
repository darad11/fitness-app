import { Archive, ArchiveRestore, ChevronRight, Lightbulb, LineChart, Pencil } from 'lucide-react';
import { Suspense, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  CustomExerciseDialog,
  describeExercise,
  ExerciseDemo,
  ExerciseGuideView,
  ExerciseMuscleMap,
  ExercisePrefsCard,
  ExerciseThumb,
  findAlternatives,
  setCustomExerciseArchived,
  useExercisePrefs,
  useExercises,
  type Exercise,
  type ExercisePref,
} from '@/modules/exercises';
import { SETTINGS_DEFAULTS, useFormatters, useSettings } from '@/modules/settings';
import { formatSetValues, useHistoryRows } from '@/modules/training';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { tExerciseMedia } from '@/shared/i18n/de-exercise-media';
import { tSession } from '@/shared/i18n/de-session';
import { Badge, Button, ButtonLink, Card, PageHeader, Skeleton, Tabs } from '@/shared/ui';
import { ExerciseNotFound } from './ExerciseProgressPage';

const RECENT_LIMIT = 5;

/**
 * Übungsdetail (S-13, AK-EXL-04, AK-EXL-05, D-258): Angaben, persönliche Angaben mit Videolink
 * und die letzten Einheiten; eigene Übungen lassen sich bearbeiten und archivieren.
 */
export function ExerciseDetailPage() {
  const { exerciseId } = useParams();
  const exercises = useExercises();
  const prefs = useExercisePrefs();
  if (exercises === undefined || prefs === undefined) {
    return (
      <div aria-busy="true" className="grid gap-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  const exercise = exercises.find((e) => e.id === exerciseId);
  if (!exercise) return <ExerciseNotFound back="/uebungen" />;
  return (
    <Detail
      key={exercise.id}
      exercise={exercise}
      library={exercises}
      pref={prefs.get(exercise.id)}
    />
  );
}

type Section = 'guide' | 'muscles' | 'alternatives';

function Detail({
  exercise,
  library,
  pref,
}: {
  exercise: Exercise;
  library: readonly Exercise[];
  pref: ExercisePref | undefined;
}) {
  const rt = useDb();
  const fmt = useFormatters();
  const settings = useSettings() ?? SETTINGS_DEFAULTS;
  const rows = useHistoryRows();
  const [editing, setEditing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [section, setSection] = useState<Section>('guide');
  const custom = exercise.source === 'custom';
  // Alternativen aus der vorhandenen Logik des Players (AK-TRN-09), ohne archivierte Übungen.
  const alternatives = useMemo(
    () =>
      findAlternatives(
        library.filter((e) => !e.archivedAt),
        exercise,
        { limit: 6 },
      ),
    [library, exercise],
  );
  const number = (value: number) => fmt.number(value, { maximumFractionDigits: 2 });
  const recent = (rows ?? [])
    .filter((row) => row.exerciseId === exercise.id)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, RECENT_LIMIT);
  const muscles = (list: readonly string[]) =>
    list.map((m) => t.exercises.muscles[m as keyof typeof t.exercises.muscles]).join(', ');

  return (
    <>
      {/* Titel, weitere Namen (oft der englische) und Muskeln als Chips (FORM, D-315). */}
      <PageHeader
        eyebrow={custom ? t.exercises.detailCustomEyebrow : t.exercises.detailEyebrow}
        title={exercise.name}
        subtitle={exercise.aliases.length > 0 ? exercise.aliases.join(' · ') : undefined}
        back={{ to: '/uebungen', label: t.exercises.title }}
      />
      {/* Demonstration der Übung (D-397); ohne Visual das Symbol in der Kachel mit den
          Muskel-Etiketten, wie bisher die Etiketten allein. */}
      <Suspense fallback={null}>
        <ExerciseDemo
          exerciseId={exercise.id}
          name={exercise.name}
          muscles={exercise.primaryMuscles}
          variant="large"
          className="-mt-2 mb-5 max-w-md"
        />
      </Suspense>
      {custom ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setEditing(true);
            }}
          >
            <Pencil aria-hidden="true" className="size-5" />
            {t.programs.edit}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setFailed(false);
              setCustomExerciseArchived(rt, exercise.id, !exercise.archivedAt).catch(
                (caught: unknown) => {
                  setFailed(true);
                  void logError(rt.db, {
                    area: 'exercises',
                    error: caught,
                    route: window.location.pathname,
                  });
                },
              );
            }}
          >
            {exercise.archivedAt ? (
              <ArchiveRestore aria-hidden="true" className="size-5" />
            ) : (
              <Archive aria-hidden="true" className="size-5" />
            )}
            {exercise.archivedAt ? t.exercises.unarchive : t.exercises.archive}
          </Button>
        </div>
      ) : null}
      {failed ? (
        <p role="alert" className="mb-4 text-danger">
          {t.exercises.saveFailed}
        </p>
      ) : null}
      {editing ? (
        <Suspense fallback={null}>
          <CustomExerciseDialog
            exercise={exercise}
            onClose={() => {
              setEditing(false);
            }}
            onSaved={() => {
              setEditing(false);
            }}
          />
        </Suspense>
      ) : null}
      <div className="grid gap-stack">
        {exercise.archivedAt ? (
          <Card>
            <Badge tone="neutral" className="mb-2">
              {t.exercises.archivedBadge}
            </Badge>
            <p className="text-sm text-muted">{t.exercises.archivedHint}</p>
          </Card>
        ) : null}
        <Tabs
          label={t.exercises.sections}
          items={[
            { key: 'guide', label: tExerciseMedia.tabGuide },
            { key: 'muscles', label: t.exercises.tabMuscles },
            { key: 'alternatives', label: t.exercises.tabAlternatives },
          ]}
          selected={section}
          onSelect={setSection}
        >
          {section === 'guide' ? (
            // Ausführung je Übung mit Quellen (D-398); eigene Übungen haben keinen Text.
            <Card>
              <Suspense fallback={<Skeleton className="h-24" />}>
                <ExerciseGuideView exercise={exercise} />
              </Suspense>
            </Card>
          ) : section === 'muscles' ? (
            <Card>
              {/* Muskelkarte (D-401): Hauptmuskeln Lime, mitarbeitende Lime mit wenig Deckkraft. */}
              <Suspense fallback={<Skeleton className="mb-4 h-24" />}>
                <ExerciseMuscleMap
                  primary={exercise.primaryMuscles}
                  secondary={exercise.secondaryMuscles}
                />
              </Suspense>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted">{t.session.info.primary}</dt>
                  <dd className="font-medium">{muscles(exercise.primaryMuscles)}</dd>
                </div>
                {exercise.secondaryMuscles.length > 0 ? (
                  <div>
                    <dt className="text-sm text-muted">{t.session.info.secondary}</dt>
                    <dd className="font-medium">{muscles(exercise.secondaryMuscles)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-sm text-muted">{t.session.info.equipment}</dt>
                  <dd className="font-medium">
                    {exercise.equipment.map((e) => t.exercises.equipment[e]).join(', ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t.session.info.tracking}</dt>
                  <dd className="font-medium">
                    {tSession.trackingModes[exercise.trackingMode]}
                    {exercise.isUnilateral ? ` · ${t.exercises.unilateral}` : ''}
                  </dd>
                </div>
              </dl>
            </Card>
          ) : alternatives.length > 0 ? (
            // Alternativen mit Vorschaubild wie in der Bibliothek (D-397).
            <ul className="divide-y divide-line rounded-card bg-surface shadow-card">
              {alternatives.map((alternative) => (
                <li key={alternative.id}>
                  <Link
                    to={`/uebungen/${alternative.id}`}
                    className="flex min-h-14 items-center gap-3 px-card py-3 first:rounded-t-card last:rounded-b-card hover:bg-surface-2"
                  >
                    <Suspense fallback={<span className="size-thumb shrink-0" />}>
                      <ExerciseThumb exerciseId={alternative.id} />
                    </Suspense>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{alternative.name}</span>
                      <span className="block text-caption text-muted">
                        {describeExercise(alternative)}
                      </span>
                    </span>
                    <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-card bg-surface p-card text-muted shadow-card">
              {t.exercises.alternativesEmpty}
            </p>
          )}
        </Tabs>
        {pref?.notes ? (
          // Tipp-Karte (FORM): die eigene Notiz mit Rand in Warnfarbe und Glühbirne.
          <section
            aria-label={tSession.yourNote}
            className="flex gap-3 rounded-card bg-surface p-card shadow-[0_0_0_1px_var(--warning)]"
          >
            <Lightbulb aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            <div className="min-w-0">
              <p className="eyebrow text-warning">{tSession.yourNote}</p>
              <p className="mt-1 whitespace-pre-line">{pref.notes}</p>
            </div>
          </section>
        ) : null}
        <ExercisePrefsCard
          exerciseId={exercise.id}
          pref={pref}
          defaults={{ restSec: settings.restDefaultSec, weightStepKg: settings.weightStepKg }}
          formatKg={number}
        />
        <Card title={t.exercises.recentTitle}>
          {rows === undefined ? (
            <Skeleton className="h-20" />
          ) : recent.length === 0 ? (
            <p className="text-muted">{t.exercises.recentEmpty}</p>
          ) : (
            <>
              <ul className="divide-y divide-line">
                {recent.map((row) => (
                  <li key={row.id}>
                    <Link
                      to={`/training/verlauf/${row.sessionId}`}
                      className="flex min-h-14 items-center gap-3 py-2 hover:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">
                          {fmt.weekdayDayMonth(new Date(row.completedAt))}
                        </span>
                        <span className="block text-sm text-muted">
                          {row.title} ·{' '}
                          {row.best
                            ? `${t.programs.setCount(row.setCount)} · ${formatSetValues(
                                row.best,
                                row.trackingMode,
                                exercise.distanceUnit,
                                number,
                              )}`
                            : t.exercises.noSets}
                        </span>
                        {row.note ? (
                          <span className="mt-1 block text-sm">
                            {tSession.yourNote}: {row.note}
                          </span>
                        ) : null}
                      </span>
                      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-faint" />
                    </Link>
                  </li>
                ))}
              </ul>
              <ButtonLink
                to={`/fortschritt/uebung/${exercise.id}`}
                variant="quiet"
                size="sm"
                className="mt-3"
              >
                <LineChart aria-hidden="true" className="size-4" />
                {t.exercises.recentMore}
              </ButtonLink>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
