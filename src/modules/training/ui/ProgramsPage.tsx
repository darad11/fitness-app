import { ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useLoaderData, useLocation, useNavigate } from 'react-router';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Badge, Button, Dialog, PageHeader, Skeleton, Toast } from '@/shared/ui';
import { describeTemplate } from '../calc/describe';
import { useOwnPrograms } from '../data/programRepository';
import { useTrainingState } from '../data/useTrainingState';
import type { OwnProgram, SampleTemplate } from '../model/program';
import { createProgram, InvalidProgramError, restoreProgram } from '../service/programService';
import { describeOwn } from './programs/describe';

/**
 * Programme und Vorlagen (S-04): eigene Programme und Vorlagen mit Archiv (D-257), gebündelte
 * Programme A, B, C mit Aktivierung (D-249) und die Beispielvorlagen.
 */
export function ProgramsPage() {
  const templates = useLoaderData<readonly SampleTemplate[]>();
  const state = useTrainingState();
  const own = useOwnPrograms();
  const programs = templates.filter((template) => template.program);
  const samples = templates.filter((template) => !template.program);
  const [creating, setCreating] = useState(false);
  const ownPrograms = own?.filter((p) => p.kind === 'program' && !p.archivedAt) ?? [];
  const ownTemplates = own?.filter((p) => p.kind === 'template' && !p.archivedAt) ?? [];
  const archived = own?.filter((p) => p.archivedAt) ?? [];
  return (
    <>
      <DeletedToast />
      <PageHeader title={t.programs.title} back={{ to: '/training', label: t.training.title }} />
      <section aria-labelledby="eigene" className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="eigene" className="eyebrow text-muted">
            {t.programs.ownTitle}
          </h2>
          <Button
            size="sm"
            onClick={() => {
              setCreating(true);
            }}
          >
            <Plus aria-hidden="true" className="size-4" />
            {t.programs.newProgram}
          </Button>
        </div>
        <p className="mt-2 mb-4 max-w-xl text-muted">{t.programs.ownIntro}</p>
        {own === undefined ? (
          <Skeleton className="h-20" />
        ) : ownPrograms.length === 0 ? (
          <p className="rounded-card bg-surface-2 p-4 text-muted">{t.programs.ownEmpty}</p>
        ) : (
          <OwnList
            programs={ownPrograms}
            badge={(program) =>
              program.id === state?.activeProgramId ? (
                <Badge tone="success">{t.programs.activeBadge}</Badge>
              ) : null
            }
          />
        )}
      </section>
      {ownTemplates.length > 0 ? (
        <section aria-labelledby="eigene-vorlagen" className="mb-8">
          <h2 id="eigene-vorlagen" className="eyebrow text-muted">
            {t.programs.ownTemplatesTitle}
          </h2>
          <p className="mt-2 mb-4 max-w-xl text-muted">{t.programs.ownTemplatesIntro}</p>
          <OwnList
            programs={ownTemplates}
            badge={() => <Badge tone="neutral">{t.programs.templateBadge}</Badge>}
          />
        </section>
      ) : null}
      {archived.length > 0 ? (
        <details className="mb-8">
          <summary className="eyebrow cursor-pointer py-2 text-muted">
            {t.programs.archiveTitle(archived.length)}
          </summary>
          <div className="mt-3">
            <OwnList
              programs={archived}
              badge={() => <Badge tone="neutral">{t.programs.archivedBadge}</Badge>}
            />
          </div>
        </details>
      ) : null}
      {creating ? (
        <NewProgramDialog
          onClose={() => {
            setCreating(false);
          }}
        />
      ) : null}
      <section aria-labelledby="programme" className="mb-8">
        <h2 id="programme" className="eyebrow text-muted">
          {t.programs.programsTitle}
        </h2>
        <p className="mt-2 mb-4 max-w-xl text-muted">{t.programs.programsIntro}</p>
        <TemplateList
          templates={programs}
          badge={(template) =>
            template.id === state?.activeProgramId ? (
              <Badge tone="success">{t.programs.activeBadge}</Badge>
            ) : (
              <Badge tone="neutral">{t.programs.programBadge}</Badge>
            )
          }
          description={(template) => template.description}
        />
      </section>
      <section aria-labelledby="beispielvorlagen">
        <h2 id="beispielvorlagen" className="eyebrow text-muted">
          {t.programs.samplesTitle}
        </h2>
        <p className="mt-2 mb-4 max-w-xl text-muted">{t.programs.samplesIntro}</p>
        <TemplateList
          templates={samples}
          badge={() => <Badge tone="accent">{t.programs.sampleBadge}</Badge>}
        />
      </section>
    </>
  );
}

function OwnList({
  programs,
  badge,
}: {
  programs: readonly OwnProgram[];
  badge: (program: OwnProgram) => React.ReactNode;
}) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {programs.map((program) => (
        <li key={program.id}>
          <Link
            to={`/training/programme/${program.id}`}
            className="flex min-h-14 items-center gap-3 rounded-card bg-surface p-5 shadow-card hover:bg-surface-2"
          >
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold break-words">{program.name}</span>
                {badge(program)}
              </span>
              <span className="mt-1 block text-sm text-muted">{describeOwn(program)}</span>
              {program.description ? (
                <span className="mt-2 line-clamp-2 block text-sm">{program.description}</span>
              ) : null}
            </span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Nach dem Löschen: 10 s „Rückgängig" (AK-PRG-11). */
function DeletedToast() {
  const rt = useDb();
  const location = useLocation();
  const deleted = (location.state as { deletedProgram?: { id: string; name: string } } | null)
    ?.deletedProgram;
  const [visible, setVisible] = useState(true);
  if (!deleted || !visible) return null;
  return (
    <Toast
      message={t.programs.deleted(deleted.name)}
      durationMs={10_000}
      onTimeout={() => {
        setVisible(false);
      }}
      action={
        <Button
          variant="onInk"
          size="sm"
          onClick={() => {
            setVisible(false);
            restoreProgram(rt, deleted.id).catch((caught: unknown) => {
              void logError(rt.db, {
                area: 'training',
                error: caught,
                route: '/training/programme',
              });
            });
          }}
        >
          {t.programs.undo}
        </Button>
      }
    />
  );
}

/** Name und Beschreibung, dann weiter in den Editor (AK-PRG-01). */
function NewProgramDialog({ onClose }: { onClose: () => void }) {
  const rt = useDb();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = () => {
    setBusy(true);
    setError(null);
    createProgram(rt, {
      name,
      description,
      firstWeek: t.programs.firstWeek,
      firstDay: t.programs.dayName(1),
    })
      .then((program) => navigate(`/training/programme/${program.id}/bearbeiten`))
      .catch((caught: unknown) => {
        if (caught instanceof InvalidProgramError) {
          setError(t.programs.nameError);
        } else {
          setError(t.programs.actionFailed);
          void logError(rt.db, { area: 'training', error: caught, route: '/training/programme' });
        }
      })
      .finally(() => {
        setBusy(false);
      });
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title={t.programs.newProgramTitle}
      closeLabel={t.common.close}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t.programs.cancel}
          </Button>
          <Button type="submit" form="neues-programm" disabled={busy}>
            {t.programs.create}
          </Button>
        </>
      }
    >
      <form
        id="neues-programm"
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div>
          <label htmlFor="programm-name" className="mb-1 block text-sm font-medium">
            {t.programs.nameLabel}
          </label>
          <input
            id="programm-name"
            required
            maxLength={80}
            autoComplete="off"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            className="h-12 w-full rounded-input border border-line bg-surface px-3 text-base text-fg"
          />
        </div>
        <div>
          <label htmlFor="programm-beschreibung" className="mb-1 block text-sm font-medium">
            {t.programs.descriptionLabel}
          </label>
          <textarea
            id="programm-beschreibung"
            rows={3}
            maxLength={2000}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
            className="w-full rounded-input border border-line bg-surface px-3 py-2 text-base text-fg"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

function TemplateList({
  templates,
  badge,
  description,
}: {
  templates: readonly SampleTemplate[];
  badge: (template: SampleTemplate) => React.ReactNode;
  description?: (template: SampleTemplate) => string | undefined;
}) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {templates.map((template) => (
        <li key={template.id}>
          <Link
            to={`/training/vorlagen/${template.key}`}
            className="flex min-h-14 items-center gap-3 rounded-card bg-surface p-5 shadow-card hover:bg-surface-2"
          >
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold">{template.name}</span>
                {badge(template)}
              </span>
              <span className="mt-1 block text-sm text-muted">{describeTemplate(template)}</span>
              {description?.(template) ? (
                <span className="mt-2 line-clamp-3 block text-sm">{description(template)}</span>
              ) : null}
            </span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
