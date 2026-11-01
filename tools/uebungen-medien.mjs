// Aktueller Name einer Datei der Übungsbilder (D-494): Die Dateien tragen die Prüfsumme ihres
// Inhalts im Namen (`kniebeuge-1a2b3c4d.mp4`), die Werkzeuge nennen sie ohne (`kniebeuge.mp4`).
// Eine frisch gerenderte Datei ohne Prüfsumme geht vor. Gegenstück zu `aktuelle_datei` in
// `tools/uebungen_medien_version.py`.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function aktuelleDatei(ordner, grund) {
  if (existsSync(join(ordner, grund))) return join(ordner, grund);
  const punkt = grund.lastIndexOf('.');
  const muster = new RegExp(`^${grund.slice(0, punkt)}-[0-9a-f]{8}\\${grund.slice(punkt)}$`);
  const treffer = readdirSync(ordner).filter((name) => muster.test(name));
  if (treffer.length !== 1) {
    throw new Error(`${grund}: ${String(treffer.length)} passende Dateien in ${ordner}`);
  }
  return join(ordner, treffer[0]);
}
