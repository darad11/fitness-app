// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addBodyWeight, listBodyWeights } from '@/modules/body';
import { startSession } from '@/modules/training';
import { buildBackup, DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import { RestoreCard } from './RestoreCard';

// Den Snapshot prüft `backup.test.ts` in Node; jsdom kann die gzip-Streams dafür nicht verbinden.
vi.mock('@/shared/db', async (original) => ({
  ...(await original<typeof import('@/shared/db')>()),
  createSnapshot: vi.fn(() => Promise.resolve({})),
}));

let rt: DbRuntime;
const downloads: string[] = [];

beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
  downloads.length = 0;
  // jsdom kennt weder Objekt-URLs noch Downloads; die Datei vor dem Ersetzen wird nur gezählt.
  // Jede Testdatei läuft in eigener Umgebung, deshalb ohne Zurücksetzen.
  URL.createObjectURL = () => 'blob:test';
  URL.revokeObjectURL = () => undefined;
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push(this.download);
  });
});

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  await rt.db.delete();
});

function renderCard() {
  render(
    <DbProvider runtime={rt}>
      <RestoreCard />
    </DbProvider>,
  );
  return screen.getByRole('region', { name: 'Sicherung wiederherstellen' });
}

function jsonFile(content: unknown, name = 'sicherung.json') {
  return new File([JSON.stringify(content)], name, { type: 'application/json' });
}

describe('Sicherung wiederherstellen (D-345)', () => {
  it('lehnt eine fremde Datei ab und sagt, dass sich nichts geändert hat', async () => {
    const user = userEvent.setup();
    const card = renderCard();
    await user.upload(within(card).getByLabelText('Sicherung wählen'), jsonFile({ hallo: 1 }));
    const status = within(card).getByRole('status');
    await waitFor(() => {
      expect(status).toHaveTextContent(
        'Diese Datei ist keine Sicherung von FORM. An deinen Daten hat sich nichts geändert.',
      );
    });
    expect(within(card).queryByRole('button', { name: 'Wiederherstellen' })).toBeNull();
  });

  it('zeigt die Zusammenfassung, fragt nach und sichert vorher den aktuellen Stand', async () => {
    await addBodyWeight(rt, { weightKg: 80.4, measuredAt: new Date('2026-10-20T07:00:00Z') });
    const exported = await buildBackup(rt.db, rt.deviceId);
    await addBodyWeight(rt, { weightKg: 82, measuredAt: new Date('2026-10-21T07:00:00Z') });

    const user = userEvent.setup();
    const card = renderCard();
    await user.upload(within(card).getByLabelText('Sicherung wählen'), jsonFile(exported));
    const summary = await within(card).findByRole('region', { name: 'In dieser Sicherung' });
    expect(summary).toHaveTextContent('Zeitraum20. Oktober 2026');
    expect(summary).toHaveTextContent('Trainings0');
    expect(summary).toHaveTextContent('Vorher sichert es den aktuellen Stand als Datei.');

    await user.click(within(card).getByRole('button', { name: 'Wiederherstellen' }));
    const dialog = await screen.findByRole('dialog', { name: 'Daten ersetzen?' });
    await user.click(within(dialog).getByRole('button', { name: 'Sichern und ersetzen' }));
    await waitFor(() => {
      expect(within(card).getByRole('status')).toHaveTextContent(
        /^Die Sicherung vom .+ ist wiederhergestellt\.$/,
      );
    });
    expect(downloads).toHaveLength(1);
    expect(downloads[0]).toMatch(/^form-sicherung-vor-wiederherstellung-/);
    expect((await listBodyWeights(rt.db)).map((w) => w.weightKg)).toEqual([80.4]);
  });

  it('auf einem leeren Gerät gibt es nichts vorher zu sichern', async () => {
    const other = await createTestRuntime({ deviceId: 'b2b2b2b2' });
    await addBodyWeight(other, { weightKg: 75, measuredAt: new Date('2026-10-20T07:00:00Z') });
    const exported = await buildBackup(other.db, other.deviceId);
    await other.db.delete();

    const user = userEvent.setup();
    const card = renderCard();
    await user.upload(within(card).getByLabelText('Sicherung wählen'), jsonFile(exported));
    await within(card).findByRole('region', { name: 'In dieser Sicherung' });
    expect(card).toHaveTextContent('Auf diesem Gerät ist noch nichts gespeichert.');
    await user.click(within(card).getByRole('button', { name: 'Wiederherstellen' }));
    const dialog = await screen.findByRole('dialog', { name: 'Sicherung übernehmen?' });
    await user.click(within(dialog).getByRole('button', { name: 'Übernehmen' }));
    await waitFor(() => {
      expect(within(card).getByRole('status')).toHaveTextContent(/wiederhergestellt\.$/);
    });
    expect(downloads).toEqual([]);
    expect((await listBodyWeights(rt.db)).map((w) => w.weightKg)).toEqual([75]);
  });

  // Sicherungen heißen seit D-352 `form-sicherung-…`; ältere `fitness-sicherung-…` gehen weiter.
  it.each(['fitness-sicherung-2026-10-20-0815.json', 'form-sicherung-2026-10-24-1730.json'])(
    'stellt die Datei %s wieder her (D-352)',
    async (name) => {
      const other = await createTestRuntime({ deviceId: 'c3c3c3c3' });
      await addBodyWeight(other, { weightKg: 77.5, measuredAt: new Date('2026-10-20T07:00:00Z') });
      const exported = await buildBackup(other.db, other.deviceId);
      await other.db.delete();

      const user = userEvent.setup();
      const card = renderCard();
      await user.upload(within(card).getByLabelText('Sicherung wählen'), jsonFile(exported, name));
      await within(card).findByRole('region', { name: 'In dieser Sicherung' });
      await user.click(within(card).getByRole('button', { name: 'Wiederherstellen' }));
      const dialog = await screen.findByRole('dialog', { name: 'Sicherung übernehmen?' });
      await user.click(within(dialog).getByRole('button', { name: 'Übernehmen' }));
      await waitFor(() => {
        expect(within(card).getByRole('status')).toHaveTextContent(/wiederhergestellt\.$/);
      });
      expect((await listBodyWeights(rt.db)).map((w) => w.weightKg)).toEqual([77.5]);
    },
  );

  it('während eines Trainings lässt sich nichts wiederherstellen', async () => {
    await addBodyWeight(rt, { weightKg: 80.4, measuredAt: new Date('2026-10-20T07:00:00Z') });
    const exported = await buildBackup(rt.db, rt.deviceId);
    await startSession(rt, { source: 'free', title: 'Frei', exercises: [] });

    const user = userEvent.setup();
    const card = renderCard();
    await user.upload(within(card).getByLabelText('Sicherung wählen'), jsonFile(exported));
    await within(card).findByRole('region', { name: 'In dieser Sicherung' });
    expect(card).toHaveTextContent('Während eines Trainings lässt sich nichts wiederherstellen.');
    expect(within(card).getByRole('button', { name: 'Wiederherstellen' })).toBeDisabled();
  });
});
