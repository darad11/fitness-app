import { z } from 'zod';
import { CORE_KEY_PATTERN } from './exercise';

/**
 * Visuals und Ausführung je Basisübung (Phase Übungen, D-397, D-398). Zugeordnet wird immer über
 * den dauerhaften Schlüssel der Basisübung (D-240), nie über den angezeigten Namen. Eigene Übungen
 * haben keine Visuals und keine Ausführungstexte aus der Bibliothek.
 */

const text = (max: number) => z.string().trim().min(1).max(max);
/** Nur https-Adressen. Bewusst als Muster statt `z.url()`: So bleibt der Prüfcode für Adressen
 *  aus dem gemeinsamen Zod-Teil der Startansicht (D-396). */
const httpsUrl = z.string().regex(/^https:\/\/[^\s/]+\.[^\s]+$/);

/** Datei unter `public/uebungen/medien/`, relativ angegeben; nur Bildformate, die Safari kann. */
const mediaFileSchema = z.strictObject({
  src: z.string().regex(/^medien\/[a-z0-9_-]+\.(?:webp|avif|png|jpg|svg|gif|mp4)$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type MediaFile = z.infer<typeof mediaFileSchema>;

/**
 * Große Demonstration im Player und in den Übungsdetails, in der Reihenfolge der Leitlinien
 * (Kapitel 3): Animation als Bild (animiertes WebP oder GIF), stummes Video im Loop, zwei Phasen
 * im Wechsel (Ausgangs- und Endposition) oder ein ruhendes Bild.
 */
export const exerciseDemoSchema = z.union([
  z.strictObject({ kind: z.literal('animation'), file: mediaFileSchema, still: mediaFileSchema }),
  z.strictObject({ kind: z.literal('video'), file: mediaFileSchema, poster: mediaFileSchema }),
  z.strictObject({
    kind: z.literal('phases'),
    start: mediaFileSchema,
    end: mediaFileSchema,
  }),
  z.strictObject({ kind: z.literal('image'), file: mediaFileSchema }),
]);

export type ExerciseDemo = z.infer<typeof exerciseDemoSchema>;

/** Herkunft und Lizenz eines Assets (Leitlinien Kapitel 6); ohne geklärte Lizenz kein Eintrag. */
export const mediaSourceSchema = z.strictObject({
  name: text(120),
  url: httpsUrl,
  license: text(120),
  licenseUrl: httpsUrl.optional(),
  /** Pflichtangabe zur Namensnennung, wie sie in der App erscheint. */
  attribution: text(200).optional(),
  commercialUse: z.boolean(),
});

export type MediaSource = z.infer<typeof mediaSourceSchema>;

export const exerciseVisualSchema = z.strictObject({
  /** Vorschaubild für Listen, quadratisch. */
  preview: mediaFileSchema,
  demo: exerciseDemoSchema.optional(),
  /** Alternativtext: was das Bild zeigt (Bewegung, Gerät), nicht nur der Name. */
  alt: text(240),
  source: z.string().regex(CORE_KEY_PATTERN),
  /** Seite oder Datei der Quelle zu genau diesem Asset. */
  origin: httpsUrl.optional(),
});

export type ExerciseVisual = z.infer<typeof exerciseVisualSchema>;

export const exerciseMediaSchema = z
  .strictObject({
    version: z.literal(1),
    sources: z.record(z.string().regex(CORE_KEY_PATTERN), mediaSourceSchema),
    visuals: z.record(z.string().regex(CORE_KEY_PATTERN), exerciseVisualSchema),
  })
  .superRefine((media, ctx) => {
    for (const [key, visual] of Object.entries(media.visuals)) {
      if (!(visual.source in media.sources)) {
        ctx.addIssue({
          code: 'custom',
          message: `Quelle fehlt: ${visual.source}`,
          path: ['visuals', key, 'source'],
        });
      }
    }
  });

export type ExerciseMedia = z.infer<typeof exerciseMediaSchema>;

// ---------------------------------------------------------------------------------------------
// Ausführung (Leitlinien Kapitel 4)

const pointList = (min: number, max: number) => z.array(text(200)).min(min).max(max);

export const guideSourceSchema = z.strictObject({
  title: text(160),
  url: httpsUrl,
});

export const exerciseGuideSchema = z.strictObject({
  /** Ein Satz: was die Übung ist und wie sie sich bewegt. */
  summary: text(200),
  /** Ausgangsposition. */
  setup: pointList(1, 4),
  /** Ausführung Schritt für Schritt. */
  steps: pointList(1, 6),
  /** Technikhinweise, Bewegungsumfang, Tempo. */
  cues: pointList(1, 5),
  /** Häufige Fehler, nur wenn eine Quelle sie nennt. */
  mistakes: pointList(1, 4).optional(),
  /** Konkrete Sicherheitshinweise. */
  safety: pointList(1, 3).optional(),
  sources: z.array(guideSourceSchema).min(1).max(3),
  /** Wo die Quelle nicht genau zur Variante passt oder ein Punkt abgeleitet ist (ehrlich offen). */
  sourceNote: text(300).optional(),
});

export type ExerciseGuide = z.infer<typeof exerciseGuideSchema>;

export const exerciseGuidesSchema = z.strictObject({
  version: z.literal(1),
  /** Abrufdatum der Quellen. */
  checked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guides: z.record(z.string().regex(CORE_KEY_PATTERN), exerciseGuideSchema),
  /** Übungen ohne belegten Text, mit Grund (Bericht, Kapitel 4). */
  open: z.array(z.strictObject({ key: z.string().regex(CORE_KEY_PATTERN), reason: text(240) })),
});

export type ExerciseGuides = z.infer<typeof exerciseGuidesSchema>;
