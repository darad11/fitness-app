import { ExternalLink } from 'lucide-react';
import { useId, useState } from 'react';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, Card, SelectField } from '@/shared/ui';
import type { ExercisePref } from '../model/exercise';
import { InvalidExerciseError, savePrefs } from '../service/exerciseService';

const REST_CHOICES = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300] as const;
const STEP_CHOICES = [0.5, 1, 1.25, 2, 2.5, 5] as const;

function formatRest(seconds: number): string {
  if (seconds < 60) return `${String(seconds)} s`;
  const rest = seconds % 60;
  return `${String(Math.floor(seconds / 60))}:${String(rest).padStart(2, '0')} min`;
}

export interface ExercisePrefsCardProps {
  exerciseId: string;
  pref: ExercisePref | undefined;
  /** Werte aus den Einstellungen, wenn die Übung keine eigenen hat. */
  defaults: { restSec: number; weightStepKg: number };
  formatKg: (value: number) => string;
}

/** Persönliche Angaben zu einer Übung (AK-EXL-04): Notiz, Standardpause, Gewichtsschritt, Videolink. */
export function ExercisePrefsCard({
  exerciseId,
  pref,
  defaults,
  formatKg,
}: ExercisePrefsCardProps) {
  const rt = useDb();
  const ids = { notes: useId(), video: useId() };
  const [notes, setNotes] = useState(pref?.notes ?? '');
  const [rest, setRest] = useState(
    pref?.defaultRestSec === undefined ? '' : String(pref.defaultRestSec),
  );
  const [step, setStep] = useState(
    pref?.weightStepKg === undefined ? '' : String(pref.weightStepKg),
  );
  const [video, setVideo] = useState(pref?.videoUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const dirty =
    notes !== (pref?.notes ?? '') ||
    rest !== (pref?.defaultRestSec === undefined ? '' : String(pref.defaultRestSec)) ||
    step !== (pref?.weightStepKg === undefined ? '' : String(pref.weightStepKg)) ||
    video !== (pref?.videoUrl ?? '');

  const restValues: number[] = [...REST_CHOICES];
  if (pref?.defaultRestSec !== undefined && !restValues.includes(pref.defaultRestSec)) {
    restValues.push(pref.defaultRestSec);
    restValues.sort((a, b) => a - b);
  }
  const stepValues: number[] = [...STEP_CHOICES];
  if (pref?.weightStepKg !== undefined && !stepValues.includes(pref.weightStepKg)) {
    stepValues.push(pref.weightStepKg);
    stepValues.sort((a, b) => a - b);
  }

  const submit = () => {
    setBusy(true);
    setError(null);
    savePrefs(rt, exerciseId, {
      notes: notes.trim() === '' ? null : notes,
      defaultRestSec: rest === '' ? null : Number(rest),
      weightStepKg: step === '' ? null : Number(step),
      videoUrl: video.trim() === '' ? null : video,
    })
      .then(() => {
        setSaved(true);
      })
      .catch((caught: unknown) => {
        if (caught instanceof InvalidExerciseError) {
          setError(t.exercises.errors[caught.reason]);
        } else {
          setError(t.exercises.saveFailed);
          void logError(rt.db, {
            area: 'exercises',
            error: caught,
            route: window.location.pathname,
          });
        }
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <Card title={t.exercises.prefsTitle}>
      <p className="-mt-2 mb-4 text-sm text-muted">{t.exercises.prefsHint}</p>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div>
          <label htmlFor={ids.notes} className="mb-2 block text-sm font-semibold text-muted">
            {t.exercises.notesLabel}
          </label>
          <textarea
            id={ids.notes}
            rows={3}
            maxLength={2000}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setSaved(false);
            }}
            className="w-full rounded-input border border-line bg-surface px-3 py-2 text-base text-fg"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label={t.exercises.restLabel}
            hint={t.exercises.restHint}
            value={rest}
            options={[
              { value: '', label: t.exercises.restDefault(formatRest(defaults.restSec)) },
              ...restValues.map((value) => ({ value: String(value), label: formatRest(value) })),
            ]}
            onChange={(value) => {
              setRest(value);
              setSaved(false);
            }}
          />
          <SelectField
            label={t.exercises.stepLabel}
            value={step}
            options={[
              { value: '', label: t.exercises.stepDefault(formatKg(defaults.weightStepKg)) },
              ...stepValues.map((value) => ({
                value: String(value),
                label: `${formatKg(value)} kg`,
              })),
            ]}
            onChange={(value) => {
              setStep(value);
              setSaved(false);
            }}
          />
        </div>
        <div>
          <label htmlFor={ids.video} className="mb-2 block text-sm font-semibold text-muted">
            {t.exercises.videoLabel}
          </label>
          <input
            id={ids.video}
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://"
            maxLength={500}
            value={video}
            onChange={(event) => {
              setVideo(event.target.value);
              setSaved(false);
            }}
            aria-describedby={`${ids.video}-hint`}
            className="h-12 w-full rounded-input border border-line bg-surface px-3 text-base text-fg"
          />
          <p id={`${ids.video}-hint`} className="mt-1 text-sm text-muted">
            {t.exercises.videoHint}
          </p>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!dirty || busy}>
            {t.exercises.save}
          </Button>
          {saved && !dirty ? (
            <span role="status" className="text-sm text-muted">
              {t.exercises.saved}
            </span>
          ) : null}
          {pref?.videoUrl ? (
            <a
              href={pref.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-pill px-4 text-sm font-semibold text-accent-ink hover:bg-surface-2"
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              {t.exercises.videoOpen}
            </a>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
