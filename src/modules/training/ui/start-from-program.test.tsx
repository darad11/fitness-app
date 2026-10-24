// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DbProvider, recentErrors, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { ActiveProgramCard } from './ActiveProgramCard';
import type { ActiveProgram } from './useActiveProgram';
import { useStartSession } from './useStartSession';

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  await rt.db.delete();
});

/** Programm, dessen nächster Tag eine Übung nennt, die es nicht mehr gibt. */
const broken = {
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
          {
            id: 'a',
            position: 0,
            name: 'Tag A',
            exercises: [
              { id: 'x', position: 0, exerciseId: 'fehlt', nameSnapshot: 'Kniebeuge', sets: [] },
            ],
          },
        ],
      },
    ],
  },
  exercises: [],
  progress: {
    total: 1,
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

/** Wie „Heute“ und „Training“: Karte mit `start` aus `useStartSession` und der Meldung. */
function Starter() {
  const { start, error, busy } = useStartSession();
  return (
    <>
      <ActiveProgramCard
        program={broken}
        eyebrow="Heute geplant"
        rest={false}
        busy={busy}
        onStart={(input) => void start(input)}
      />
      {error ? <p role="alert">{error.message}</p> : null}
    </>
  );
}

describe('Start aus einem Programm (B-07)', () => {
  it('fehlt eine Übung, erscheint die Meldung und der Fehler steht im Protokoll', async () => {
    // Am alten Stand warf der Klick-Handler; React meldet das als Fehler in der Konsole.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(
      <DbProvider runtime={rt}>
        <MemoryRouter>
          <Starter />
        </MemoryRouter>
      </DbProvider>,
    );
    const button = screen.getByRole('button', { name: 'Training starten' });
    await user.click(button);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Das Training ließ sich nicht starten.',
    );
    expect(button).toBeEnabled();
    expect(recentErrors().map((entry) => entry.area)).toContain('training');
  });
});
