import { ArrowDown, ArrowUp, ChevronRight, Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { SETTINGS_DEFAULTS, useSettings } from '@/modules/settings';
import { uuidv4 } from '@/shared/lib/uuid';
import { t } from '@/shared/i18n/de';
import { tProgramEditor } from '@/shared/i18n/de-program-editor';
import { Button, ButtonLink, Card, IconButton, PageHeader, Skeleton, Switch } from '@/shared/ui';
import {
  addDay,
  addWeek,
  duplicateDay,
  duplicateWeek,
  moveDay,
  moveWeek,
  removeDay,
  removeWeek,
  renameWeek,
} from '../../calc/programEdit';
import { useOwnProgram } from '../../data/programRepository';
import type { Day, OwnProgram, Week } from '../../model/program';
import { describeDay } from '../../calc/describe';
import {
  ConfirmDialog,
  ErrorMessage,
  INPUT,
  NameDialog,
  TEXTAREA,
  useProgramEdit,
} from './editorParts';

/** Programm-Editor (S-06, AK-PRG-01, AK-PRG-02, D-257): Angaben, Wochen und Tage. */
export function ProgramEditPage() {
  const { id } = useParams();
  const program = useOwnProgram(id);
  if (program === undefined) {
    return (
      <div aria-busy="true" className="grid gap-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (program === null) {
    return (
      <>
        <PageHeader
          title={t.programs.notFoundTitle}
          back={{ to: '/training/programme', label: t.programs.title }}
        />
        <p className="mb-6 text-muted">{t.programs.notFoundOwn}</p>
        <ButtonLink to="/training/programme">{t.programs.title}</ButtonLink>
      </>
    );
  }
  return <Editor key={program.id} program={program} />;
}

type Pending =
  | { kind: 'renameWeek'; week: Week }
  | { kind: 'removeWeek'; week: Week }
  | { kind: 'removeDay'; day: Day };

function Editor({ program }: { program: OwnProgram }) {
  const { apply, applyWeeks, error } = useProgramEdit(program.id);
  const [pending, setPending] = useState<Pending | null>(null);
  const restDefaultSec = (useSettings() ?? SETTINGS_DEFAULTS).restDefaultSec;
  const weeks = program.weeks;
  const close = () => {
    setPending(null);
  };

  return (
    <>
      <PageHeader
        eyebrow={tProgramEditor.title}
        title={program.name}
        back={{ to: `/training/programme/${program.id}`, label: tProgramEditor.backToProgram }}
      />
      <p className="mb-4 max-w-xl text-sm text-muted">{tProgramEditor.autosave}</p>
      <ErrorMessage error={error} />
      <div className="grid gap-6">
        <DetailsCard program={program} onSave={apply} />
        <section aria-labelledby="wochen" className="grid gap-4">
          <h2 id="wochen" className="eyebrow text-muted">
            {tProgramEditor.weeksTitle}
          </h2>
          {weeks.map((week, weekIndex) => (
            <Card key={week.id}>
              {/* Passt der Name nicht neben die Knöpfe, rücken die Knöpfe gemeinsam in die nächste
                  Zeile, statt das Wort zu trennen (F5 Abschnitt 9, D-331). */}
              <div className="flex flex-wrap items-center justify-end gap-1">
                <h3 className="min-w-0 grow text-lg font-semibold break-words">{week.name}</h3>
                <div className="flex gap-1">
                  <IconButton
                    label={tProgramEditor.renameItem(week.name)}
                    onClick={() => {
                      setPending({ kind: 'renameWeek', week });
                    }}
                  >
                    <Pencil aria-hidden="true" className="size-5" />
                  </IconButton>
                  <IconButton
                    label={tProgramEditor.moveUp(week.name)}
                    disabled={weekIndex === 0}
                    onClick={() => void applyWeeks((all) => moveWeek(all, week.id, -1))}
                  >
                    <ArrowUp aria-hidden="true" className="size-5" />
                  </IconButton>
                  <IconButton
                    label={tProgramEditor.moveDown(week.name)}
                    disabled={weekIndex === weeks.length - 1}
                    onClick={() => void applyWeeks((all) => moveWeek(all, week.id, 1))}
                  >
                    <ArrowDown aria-hidden="true" className="size-5" />
                  </IconButton>
                  <IconButton
                    label={tProgramEditor.duplicateItem(week.name)}
                    onClick={() =>
                      void applyWeeks((all) =>
                        duplicateWeek(all, week.id, t.programs.copySuffix(week.name), uuidv4),
                      )
                    }
                  >
                    <Copy aria-hidden="true" className="size-5" />
                  </IconButton>
                  <IconButton
                    label={tProgramEditor.removeItem(week.name)}
                    disabled={weeks.length <= 1}
                    onClick={() => {
                      setPending({ kind: 'removeWeek', week });
                    }}
                  >
                    <Trash2 aria-hidden="true" className="size-5" />
                  </IconButton>
                </div>
              </div>
              <ul className="mt-3 divide-y divide-line">
                {week.days.map((day, dayIndex) => (
                  <li key={day.id} className="flex flex-wrap items-center gap-1 py-2">
                    <Link
                      to={`/training/programme/${program.id}/tage/${day.id}`}
                      className="flex min-h-12 min-w-0 flex-1 basis-56 items-center gap-2 rounded-input px-2 hover:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium break-words">
                          {day.name}
                          <span className="sr-only">{tProgramEditor.editDaySuffix}</span>
                        </span>
                        <span className="block text-sm text-muted">
                          {day.exercises.length === 0
                            ? tProgramEditor.noExercises
                            : describeDay(day, restDefaultSec)}
                          {day.weekdayHint
                            ? ` · ${t.programs.weekdays[day.weekdayHint - 1] ?? ''}`
                            : ''}
                        </span>
                      </span>
                      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-faint" />
                    </Link>
                    <span className="flex">
                      <IconButton
                        label={tProgramEditor.moveUp(day.name)}
                        disabled={dayIndex === 0}
                        onClick={() => void applyWeeks((all) => moveDay(all, day.id, -1))}
                      >
                        <ArrowUp aria-hidden="true" className="size-5" />
                      </IconButton>
                      <IconButton
                        label={tProgramEditor.moveDown(day.name)}
                        disabled={dayIndex === week.days.length - 1}
                        onClick={() => void applyWeeks((all) => moveDay(all, day.id, 1))}
                      >
                        <ArrowDown aria-hidden="true" className="size-5" />
                      </IconButton>
                      <IconButton
                        label={tProgramEditor.duplicateItem(day.name)}
                        onClick={() =>
                          void applyWeeks((all) =>
                            duplicateDay(all, day.id, t.programs.copySuffix(day.name), uuidv4),
                          )
                        }
                      >
                        <Copy aria-hidden="true" className="size-5" />
                      </IconButton>
                      <IconButton
                        label={tProgramEditor.removeItem(day.name)}
                        disabled={week.days.length <= 1}
                        onClick={() => {
                          setPending({ kind: 'removeDay', day });
                        }}
                      >
                        <Trash2 aria-hidden="true" className="size-5" />
                      </IconButton>
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                variant="quiet"
                size="sm"
                className="mt-2"
                onClick={() =>
                  void applyWeeks((all) =>
                    addDay(all, week.id, t.programs.dayName(week.days.length + 1), uuidv4),
                  )
                }
              >
                <Plus aria-hidden="true" className="size-4" />
                {tProgramEditor.addDay}
              </Button>
            </Card>
          ))}
          <Button
            variant="secondary"
            className="justify-self-start"
            onClick={() =>
              void applyWeeks((all) =>
                addWeek(
                  all,
                  { week: t.programs.weekName(all.length + 1), day: t.programs.dayName(1) },
                  uuidv4,
                ),
              )
            }
          >
            <Plus aria-hidden="true" className="size-5" />
            {tProgramEditor.addWeek}
          </Button>
        </section>
      </div>

      {pending?.kind === 'renameWeek' ? (
        <NameDialog
          title={tProgramEditor.renameWeek}
          label={t.programs.nameLabel}
          initial={pending.week.name}
          onClose={close}
          onSave={(name) => {
            close();
            void applyWeeks((all) => renameWeek(all, pending.week.id, name));
          }}
        />
      ) : null}
      {pending?.kind === 'removeWeek' ? (
        <ConfirmDialog
          title={tProgramEditor.removeWeekTitle(pending.week.name)}
          confirmLabel={t.programs.delete}
          onClose={close}
          onConfirm={() => {
            close();
            void applyWeeks((all) => removeWeek(all, pending.week.id), {
              last: tProgramEditor.lastWeek,
            });
          }}
        >
          {tProgramEditor.removeWeekText(pending.week.days.length)}
        </ConfirmDialog>
      ) : null}
      {pending?.kind === 'removeDay' ? (
        <ConfirmDialog
          title={tProgramEditor.removeDayTitle(pending.day.name)}
          confirmLabel={t.programs.delete}
          onClose={close}
          onConfirm={() => {
            close();
            void applyWeeks((all) => removeDay(all, pending.day.id), {
              last: tProgramEditor.lastDay,
            });
          }}
        >
          {tProgramEditor.removeDayText}
        </ConfirmDialog>
      ) : null}
    </>
  );
}

/** Name, Beschreibung und „Wiederholen" mit ausdrücklichem Speichern. */
function DetailsCard({
  program,
  onSave,
}: {
  program: OwnProgram;
  onSave: ReturnType<typeof useProgramEdit>['apply'];
}) {
  const [name, setName] = useState(program.name);
  const [description, setDescription] = useState(program.description ?? '');
  const [saved, setSaved] = useState(false);
  const dirty = name !== program.name || description !== (program.description ?? '');
  return (
    <Card title={tProgramEditor.details}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave((plan) => ({ ...plan, name, description })).then((ok) => {
            setSaved(ok);
          });
        }}
      >
        <div>
          <label htmlFor="editor-name" className="mb-1 block text-sm font-medium">
            {t.programs.nameLabel}
          </label>
          <input
            id="editor-name"
            required
            maxLength={80}
            autoComplete="off"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="editor-beschreibung" className="mb-1 block text-sm font-medium">
            {t.programs.descriptionLabel}
          </label>
          <textarea
            id="editor-beschreibung"
            rows={3}
            maxLength={2000}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setSaved(false);
            }}
            className={TEXTAREA}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!dirty}>
            {t.programs.save}
          </Button>
          {saved && !dirty ? (
            <span role="status" className="text-sm text-muted">
              {tProgramEditor.detailsSaved}
            </span>
          ) : null}
        </div>
      </form>
      <div className="mt-4 border-t border-line pt-2">
        <Switch
          label={tProgramEditor.repeat}
          hint={tProgramEditor.repeatHint}
          checked={program.repeat}
          onChange={(repeat) => void onSave((plan) => ({ ...plan, repeat }))}
        />
      </div>
    </Card>
  );
}
