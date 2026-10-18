import { describe, expect, it, vi } from 'vitest';
import { loadSampleTemplate, loadSampleTemplates } from './sampleTemplates';

describe('Laden der Beispielvorlagen', () => {
  it('lädt einmal und liefert dieselbe, unveränderliche Liste', async () => {
    const first = await loadSampleTemplates();
    expect(first).toHaveLength(4);
    expect(await loadSampleTemplates()).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it('findet eine Vorlage über ihren Schlüssel', async () => {
    expect((await loadSampleTemplate('push_pull_legs'))?.name).toBe('Push/Pull/Beine');
    expect(await loadSampleTemplate('gibt_es_nicht')).toBeUndefined();
  });
});

describe('Fehler beim Nachladen', () => {
  it('meldet den Fehler und lädt beim nächsten Aufruf erneut', async () => {
    vi.resetModules();
    let fail = true;
    vi.doMock('./sample-templates.v1.json', async (importOriginal) => {
      if (fail) throw new Error('Datei nicht erreichbar');
      return importOriginal();
    });
    const fresh = await import('./sampleTemplates');
    await expect(fresh.loadSampleTemplates()).rejects.toThrow();
    fail = false;
    vi.resetModules();
    await expect(fresh.loadSampleTemplates()).resolves.toHaveLength(4);
    vi.doUnmock('./sample-templates.v1.json');
  });
});
