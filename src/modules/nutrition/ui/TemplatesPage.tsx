import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFormatters } from '@/modules/settings';
import { logError, useDb } from '@/shared/db';
import { t } from '@/shared/i18n/de';
import { Button, IconButton, PageHeader, Skeleton, Toast } from '@/shared/ui';
import { useMealTemplates } from '../data/nutritionRepository';
import type { MealTemplate } from '../model/mealTemplate';
import { deleteTemplate, restoreTemplate } from '../service/mealTemplateService';
import { describeAmount, kcal } from './format';
import { RenameTemplateDialog, templateKcal } from './TemplateDialogs';

/** Mahlzeit-Vorlagen verwalten (NU-11, D-268): ansehen, umbenennen, löschen mit Rückgängig. */
export function TemplatesPage() {
  const rt = useDb();
  const fmt = useFormatters();
  const templates = useMealTemplates();
  const [renaming, setRenaming] = useState<MealTemplate | null>(null);
  const [deleted, setDeleted] = useState<MealTemplate | null>(null);

  const remove = (template: MealTemplate) => {
    deleteTemplate(rt, template.id).then(
      () => {
        setDeleted(template);
      },
      (caught: unknown) => {
        void logError(rt.db, { area: 'nutrition', error: caught, route: window.location.pathname });
      },
    );
  };

  return (
    <>
      <PageHeader
        title={t.nutrition.templates.title}
        back={{ to: '/ernaehrung', label: t.nutrition.title }}
      />
      {templates === undefined ? (
        <Skeleton className="h-32" />
      ) : templates.length === 0 ? (
        <p className="rounded-card bg-surface-2 p-4 text-muted">{t.nutrition.templates.empty}</p>
      ) : (
        <ul aria-label={t.nutrition.templates.title} className="grid gap-3">
          {templates.map((template) => (
            <li key={template.id} className="rounded-card bg-surface p-4 shadow-card">
              <div className="flex items-start gap-2">
                <details className="min-w-0 flex-1">
                  <summary className="cursor-pointer">
                    <span className="font-medium break-words">{template.name}</span>
                    <span className="block text-sm text-muted">
                      {t.nutrition.templates.summary(
                        template.items.length,
                        kcal(fmt, templateKcal(template)),
                      )}
                    </span>
                  </summary>
                  <ul className="mt-2 divide-y divide-line text-sm">
                    {template.items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-3 py-1.5">
                        <span className="min-w-0 break-words">
                          {item.nameSnapshot}
                          <span className="block text-muted">
                            {describeAmount(fmt, {
                              amount: item.amount,
                              basisSnapshot: item.basisSnapshot,
                              servingSnapshot: item.servingSnapshot,
                            })}
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {kcal(fmt, item.nutrients.kcal ?? 0)} {t.nutrition.units.kcal}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
                <IconButton
                  label={t.nutrition.templates.renameLabel(template.name)}
                  onClick={() => {
                    setRenaming(template);
                  }}
                >
                  <Pencil aria-hidden="true" className="size-5" />
                </IconButton>
                <IconButton
                  label={t.nutrition.templates.deleteLabel(template.name)}
                  onClick={() => {
                    remove(template);
                  }}
                >
                  <Trash2 aria-hidden="true" className="size-5" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      {renaming ? (
        <RenameTemplateDialog
          key={renaming.id}
          template={renaming}
          onClose={() => {
            setRenaming(null);
          }}
        />
      ) : null}
      {deleted ? (
        <Toast
          key={deleted.id}
          message={t.nutrition.templates.deleted(deleted.name)}
          durationMs={10_000}
          onTimeout={() => {
            setDeleted(null);
          }}
          action={
            <Button
              variant="onInk"
              size="sm"
              onClick={() => {
                const template = deleted;
                setDeleted(null);
                restoreTemplate(rt, template.id).catch((caught: unknown) => {
                  void logError(rt.db, {
                    area: 'nutrition',
                    error: caught,
                    route: window.location.pathname,
                  });
                });
              }}
            >
              {t.nutrition.undo}
            </Button>
          }
        />
      ) : null}
    </>
  );
}
