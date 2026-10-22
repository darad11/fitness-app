// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { ActiveProgramCard, plannedEyebrow, plannedRest } from './ActiveProgramCard';
import type { ActiveProgram } from './useActiveProgram';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

/** Eigenes Programm mit festen Wochentagen: Montag und Mittwoch. */
const program = {
  template: {
    id: 'p',
    name: 'Plan',
    repeat: true,
    weeks: [
      {
        id: 'w',
        position: 0,
        name: 'Woche 1',
        days: [
          { id: 'a', position: 0, name: 'Tag A', weekdayHint: 1, exercises: [] },
          { id: 'b', position: 1, name: 'Tag B', weekdayHint: 3, exercises: [] },
        ],
      },
    ],
  },
  exercises: [],
  progress: {
    total: 2,
    completed: 0,
    round: 1,
    doneInRound: new Set<number>(),
    next: {
      index: 0,
      weekIndex: 0,
      dayIndex: 0,
      weekId: 'w',
      dayId: 'a',
      name: 'Tag A',
      weekName: 'Woche 1',
    },
    finished: false,
  },
  state: {},
} as unknown as ActiveProgram;

// 19.10.2026 ist ein Montag, 22.10.2026 ein Donnerstag.
const monday = new Date(2026, 9, 19, 12);
const thursday = new Date(2026, 9, 22, 12);

function renderCard(now: Date) {
  render(
    <DbProvider runtime={rt}>
      <MemoryRouter>
        <ActiveProgramCard
          program={program}
          eyebrow={plannedEyebrow(program, now)}
          rest={plannedRest(program, now)}
          busy={false}
          onStart={() => undefined}
        />
      </MemoryRouter>
    </DbProvider>,
  );
}

describe('Ruhetag auf „Heute“ (Leitplanken Regel 6, D-318)', () => {
  it('zeigt an einem Tag ohne Training „Heute ist Pause eingeplant.“; Starten bleibt möglich', () => {
    renderCard(thursday);
    expect(screen.getByText('Geplant für Montag')).toBeVisible();
    expect(screen.getByText('Heute ist Pause eingeplant.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Training starten' })).toBeEnabled();
  });

  it('zeigt am geplanten Tag keinen Ruhetag', () => {
    renderCard(monday);
    expect(screen.getByText('Heute geplant')).toBeVisible();
    expect(screen.queryByText('Heute ist Pause eingeplant.')).toBeNull();
  });
});
