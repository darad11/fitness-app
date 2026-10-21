import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { parseDecimal } from '@/shared/lib/format';
import { Button, Card, IconButton } from '@/shared/ui';
import { fieldsFor, toDisplay, toStored } from '../calc/fields';
import { liveExercises, liveSets } from '../calc/session';
import { NOTE_MAX, type Session, type SetValues } from '../model/session';
import { editCompletedSession, InvalidEditError } from '../service/historyService';
import { InvalidValueError } from '../service/sessionService';

const INPUT = 'field w-full min-w-0';

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Abgeschlossene Einheit bearbeiten (AK-HIS-03): Titel, Beginn, Dauer, Notiz, Werte, Sätze entfernen. */
export function HistoryEditForm({
  session,
  number,
  onDone,
}: {
  session: Session;
  number: (value: number) => string;
  onDone: () => void;
}) {
  const rt = useDb();
  const [title, setTitle] = useState(session.title);
  const [when, setWhen] = useState(toLocalInput(session.startedAt));
  const [minutes, setMinutes] = useState(String(Math.round((session.durationSec ?? 0) / 60)));
  const [notes, setNotes] = useState(session.notes ?? '');
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(liveExercises(session).map((e) => [e.id, e.note ?? ''])),
  );
  const [values, setValues] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {};
    for (const exercise of liveExercises(session)) {
      for (const set of liveSets(exercise)) {
        if (set.status !== 'done') continue;
        const row: Record<string, string> = {};
        for (const spec of fieldsFor(exercise.trackingMode, exercise.distanceUnit)) {
          const stored = set.actual[spec.field];
          row[spec.label] = stored === undefined ? '' : number(toDisplay(spec, stored));
        }
        initial[set.id] = row;
      }
    }
    return initial;
  });
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const duration = parseDecimal(minutes);
    if (duration === null) {
      setError(t.historyEdit.errors.duration);
      return;
    }
    const sets: Record<string, SetValues> = {};
    for (const exercise of liveExercises(session)) {
      for (const set of liveSets(exercise)) {
        const row = values[set.id];
        if (!row || removed.has(set.id)) continue;
        const parsed: SetValues = {};
        for (const spec of fieldsFor(exercise.trackingMode, exercise.distanceUnit)) {
          const text = row[spec.label] ?? '';
          if (!text.trim()) continue;
          const value = parseDecimal(text);
          if (value === null) {
            setError(t.historyEdit.errors.values);
            return;
          }
          parsed[spec.field] = toStored(spec, value);
        }
        sets[set.id] = parsed;
      }
    }
    setBusy(true);
    setError(null);
    try {
      await editCompletedSession(rt, session.id, {
        title,
        startedAt: new Date(when),
        durationSec: Math.round(duration * 60),
        notes,
        sets,
        removeSetIds: [...removed],
        exerciseNotes: Object.fromEntries(
          liveExercises(session)
            .filter((e) => (exerciseNotes[e.id] ?? '') !== (e.note ?? ''))
            .map((e) => [e.id, exerciseNotes[e.id] ?? '']),
        ),
      });
      onDone();
    } catch (caught) {
      if (caught instanceof InvalidEditError) setError(t.historyEdit.errors[caught.reason]);
      else if (caught instanceof InvalidValueError) setError(t.session.invalid[caught.field]);
      else {
        void logError(rt.db, { area: 'training', error: caught, route: window.location.pathname });
        setError(t.historyEdit.saveFailed);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <Card title={t.historyEdit.title}>
        <div className="grid gap-4">
          <Labeled id="verlauf-titel" label={t.log.titleLabel}>
            <input
              id="verlauf-titel"
              type="text"
              maxLength={200}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
              className={INPUT}
            />
          </Labeled>
          <div className="grid grid-cols-2 gap-3">
            <Labeled id="verlauf-beginn" label={t.log.start}>
              <input
                id="verlauf-beginn"
                type="datetime-local"
                value={when}
                onChange={(e) => {
                  setWhen(e.target.value);
                }}
                className={INPUT}
              />
            </Labeled>
            <Labeled id="verlauf-dauer" label={t.log.durationMin}>
              <input
                id="verlauf-dauer"
                type="text"
                inputMode="numeric"
                value={minutes}
                onChange={(e) => {
                  setMinutes(e.target.value);
                }}
                className={INPUT}
              />
            </Labeled>
          </div>
          <Labeled id="verlauf-notiz" label={t.log.notes}>
            <textarea
              id="verlauf-notiz"
              rows={2}
              maxLength={5000}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
              }}
              className="field w-full"
            />
          </Labeled>
        </div>
      </Card>
      {liveExercises(session).map((exercise) => {
        const specs = fieldsFor(exercise.trackingMode, exercise.distanceUnit);
        let working = 0;
        let warmup = 0;
        let drop = 0;
        const done = liveSets(exercise).filter((set) => set.status === 'done');
        if (done.length === 0 && !exercise.note) return null;
        return (
          <Card key={exercise.id} title={exercise.nameSnapshot}>
            <Labeled id={`notiz-${exercise.id}`} label={t.session.noteTitle(exercise.nameSnapshot)}>
              <textarea
                id={`notiz-${exercise.id}`}
                rows={2}
                maxLength={NOTE_MAX}
                value={exerciseNotes[exercise.id] ?? ''}
                onChange={(event) => {
                  setExerciseNotes((all) => ({ ...all, [exercise.id]: event.target.value }));
                }}
                className="field mb-3 w-full"
              />
            </Labeled>
            <ol className="grid gap-2">
              {liveSets(exercise).map((set) => {
                const ordinal =
                  set.type === 'working' ? ++working : set.type === 'warmup' ? ++warmup : ++drop;
                if (set.status !== 'done') return null;
                const gone =
                  removed.has(set.id) ||
                  (set.parentSetId !== undefined && removed.has(set.parentSetId));
                const name = `${exercise.nameSnapshot}, ${t.session.setLabel(t.session.setTypeLabel[set.type], ordinal)}`;
                return (
                  <li
                    key={set.id}
                    className={
                      gone ? 'flex items-center gap-2 opacity-50' : 'flex items-center gap-2'
                    }
                  >
                    <span
                      aria-hidden="true"
                      className="w-8 shrink-0 text-sm font-semibold text-muted tabular-nums"
                    >
                      {set.type === 'working' ? String(ordinal) : t.session.setTypeShort[set.type]}
                    </span>
                    <div
                      className={
                        specs.length === 2
                          ? 'grid min-w-0 flex-1 grid-cols-2 gap-2'
                          : 'grid min-w-0 flex-1 gap-2'
                      }
                    >
                      {specs.map((spec) => (
                        <input
                          key={spec.label}
                          type="text"
                          inputMode={spec.decimals ? 'decimal' : 'numeric'}
                          disabled={gone}
                          aria-label={`${t.session.fields[spec.label]}, ${name}`}
                          value={values[set.id]?.[spec.label] ?? ''}
                          onChange={(event) => {
                            setValues((all) => ({
                              ...all,
                              [set.id]: { ...all[set.id], [spec.label]: event.target.value },
                            }));
                          }}
                          className={INPUT}
                        />
                      ))}
                    </div>
                    <IconButton
                      label={`${gone ? t.historyEdit.keepSet : t.session.removeSet}, ${name}`}
                      onClick={() => {
                        setRemoved((all) => {
                          const next = new Set(all);
                          if (next.has(set.id)) next.delete(set.id);
                          else next.add(set.id);
                          return next;
                        });
                      }}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </IconButton>
                  </li>
                );
              })}
            </ol>
          </Card>
        );
      })}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {t.historyEdit.save}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          {t.session.cancel}
        </Button>
      </div>
    </form>
  );
}

function Labeled({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
