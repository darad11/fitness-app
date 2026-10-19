import { Archive, ArchiveRestore, Copy, FilePlus2, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, ButtonLink, Card, Dialog, PageHeader, Skeleton } from '@/shared/ui';
import { useOwnProgram } from '../../data/programRepository';
import { useTrainingState } from '../../data/useTrainingState';
import type { OwnProgram } from '../../model/program';
import { copyProgram, deleteProgram, setArchived } from '../../service/programService';
import { ProgramDetail } from '../SampleTemplatePage';
import { describeOwn } from './describe';
import { useLibrary } from './useLibrary';

/** Eigenes Programm oder eigene Vorlage (S-05, AK-PRG-05, AK-PRG-06, AK-PRG-11, D-257). */
export function OwnProgramPage() {
  const { id } = useParams();
  const program = useOwnProgram(id);
  const exercises = useLibrary();
  if (program === undefined || exercises === undefined) {
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
  const isTemplate = program.kind === 'template';
  return (
    <ProgramDetail
      key={program.id}
      template={program}
      exercises={exercises}
      isProgram={!isTemplate && !program.archivedAt}
      eyebrow={isTemplate ? t.programs.ownTemplateEyebrow : t.programs.ownEyebrow}
      subtitle={describeOwn(program)}
      actions={<ProgramActions program={program} />}
      notice={
        program.archivedAt ? (
          <Card>
            <p className="text-muted">{t.programs.archivedHint}</p>
          </Card>
        ) : isTemplate ? (
          <Card>
            <p className="text-muted">{t.programs.templateStartHint}</p>
          </Card>
        ) : null
      }
    />
  );
}

function ProgramActions({ program }: { program: OwnProgram }) {
  const rt = useDb();
  const navigate = useNavigate();
  const state = useTrainingState();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isTemplate = program.kind === 'template';
  const isActive = state?.activeProgramId === program.id;

  const run = (action: () => Promise<unknown>) => {
    setBusy(true);
    setFailed(false);
    action()
      .catch((caught: unknown) => {
        setFailed(true);
        void logError(rt.db, { area: 'training', error: caught, route: window.location.pathname });
      })
      .finally(() => {
        setBusy(false);
      });
  };
  const copyAs = (kind: OwnProgram['kind'], name: string) => {
    run(async () => {
      const copy = await copyProgram(rt, program, { name, kind });
      await navigate(`/training/programme/${copy.id}`);
    });
  };

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2">
        <ButtonLink to={`/training/programme/${program.id}/bearbeiten`} variant="secondary">
          <Pencil aria-hidden="true" className="size-5" />
          {t.programs.edit}
        </ButtonLink>
        {isTemplate ? (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              copyAs('program', program.name);
            }}
          >
            <FilePlus2 aria-hidden="true" className="size-5" />
            {t.programs.useTemplate}
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              copyAs('template', program.name);
            }}
          >
            <FilePlus2 aria-hidden="true" className="size-5" />
            {t.programs.saveAsTemplate}
          </Button>
        )}
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            copyAs(program.kind, t.programs.copySuffix(program.name));
          }}
        >
          <Copy aria-hidden="true" className="size-5" />
          {t.programs.duplicate}
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            run(() => setArchived(rt, program.id, !program.archivedAt));
          }}
        >
          {program.archivedAt ? (
            <ArchiveRestore aria-hidden="true" className="size-5" />
          ) : (
            <Archive aria-hidden="true" className="size-5" />
          )}
          {program.archivedAt ? t.programs.unarchive : t.programs.archive}
        </Button>
        <Button
          variant="danger"
          disabled={busy}
          onClick={() => {
            setConfirmDelete(true);
          }}
        >
          <Trash2 aria-hidden="true" className="size-5" />
          {t.programs.delete}
        </Button>
      </div>
      {failed ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {t.programs.actionFailed}
        </p>
      ) : null}
      <Dialog
        open={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
        }}
        title={t.programs.deleteTitle(program.name)}
        closeLabel={t.common.close}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmDelete(false);
              }}
            >
              {t.programs.cancel}
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => {
                setConfirmDelete(false);
                run(async () => {
                  await deleteProgram(rt, program.id);
                  await navigate('/training/programme', {
                    state: { deletedProgram: { id: program.id, name: program.name } },
                  });
                });
              }}
            >
              {t.programs.delete}
            </Button>
          </>
        }
      >
        <p className="text-muted">
          {isActive ? t.programs.deleteActiveText : t.programs.deleteText}
        </p>
      </Dialog>
    </div>
  );
}
