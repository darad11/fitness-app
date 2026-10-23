// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DbProvider, type DbRuntime } from '@/shared/db';
import { createTestRuntime } from '@/shared/testing/db';
import type { BarcodeLookup } from '../service/barcodeService';

let resolveLookup: (lookup: BarcodeLookup) => void = () => undefined;
vi.mock('../service/barcodeService', () => ({
  lookupBarcode: () =>
    new Promise<BarcodeLookup>((resolve) => {
      resolveLookup = resolve;
    }),
}));

const { BarcodeFlow } = await import('./BarcodeFlow');

let rt: DbRuntime;
beforeEach(async () => {
  rt = await createTestRuntime({ deviceId: 'a1b2c3d4' });
});
afterEach(async () => {
  cleanup();
  await rt.db.delete();
});

describe('Scanner schließen bricht die Suche ab (C-03)', () => {
  it('ein spätes Ergebnis öffnet nach dem Schließen nichts mehr', async () => {
    const user = userEvent.setup();
    const onFood = vi.fn();
    const onClose = vi.fn();
    render(
      <DbProvider runtime={rt}>
        <MemoryRouter>
          <BarcodeFlow returnTo="/ernaehrung" onClose={onClose} onFood={onFood} />
        </MemoryRouter>
      </DbProvider>,
    );
    const scanner = await screen.findByRole('dialog', { name: 'Barcode scannen' });
    await user.type(within(scanner).getByLabelText('Barcode eingeben'), '9001234567896');
    await user.click(within(scanner).getByRole('button', { name: 'Suchen' }));
    await user.click(within(scanner).getByRole('button', { name: 'Schließen' }));
    expect(onClose).toHaveBeenCalledOnce();
    // Die Komponente bleibt hier eingehängt; das späte Ergebnis darf trotzdem nichts öffnen.
    resolveLookup({ kind: 'needsConsent', barcode: '9001234567896' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole('dialog', { name: 'Open Food Facts verwenden?' })).toBeNull();
    expect(onFood).not.toHaveBeenCalled();
  });
});
