import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, minify, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// Die globalen Header aus vercel.json gelten auch für `vite preview`, damit die E2E-Tests mit
// derselben Content Security Policy laufen wie die Produktivadresse.
interface VercelConfig {
  headers?: { source: string; headers: { key: string; value: string }[] }[];
}
const vercel = JSON.parse(
  readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'),
) as VercelConfig;
const previewHeaders = Object.fromEntries(
  (vercel.headers?.find((entry) => entry.source === '/(.*)')?.headers ?? []).map(
    ({ key, value }) => [key, value],
  ),
);

// VERCEL_ENV ist bei Vercel-Builds gesetzt: production, preview oder development.
const appEnv = process.env.VERCEL_ENV ?? (process.env.CI ? 'ci' : 'local');
const buildSha = (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'lokal').slice(
  0,
  7,
);

/**
 * Startansicht schlanker (D-396): Die klassischen Skripte im Kopf (`theme-init.js`,
 * `startflaeche.js`) kommen unverändert aus `public/` und gingen bisher samt Kommentaren raus.
 * Beim Bauen werden sie mit dem Minifier von Vite verkleinert, bevor der Service Worker ihre
 * Prüfsummen berechnet; `index.html` verliert ihre Kommentare. Die Quellen bleiben lesbar.
 */
const HEAD_SCRIPTS = ['theme-init.js', 'startflaeche.js'];
function slimStartView(): Plugin {
  let outDir = 'dist';
  return {
    name: 'form-slim-start-view',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir.startsWith('/')
        ? config.build.outDir
        : `${config.root}/${config.build.outDir}`;
    },
    transformIndexHtml: {
      order: 'post',
      handler: (html) =>
        html
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\n\s*\n/g, '\n'),
    },
    writeBundle: {
      order: 'pre',
      async handler() {
        for (const name of HEAD_SCRIPTS) {
          const file = `${outDir}/${name}`;
          const result = await minify(name, readFileSync(file, 'utf8'), {
            compress: true,
            mangle: true,
          });
          if (result.errors.length > 0) {
            throw new Error(`${name}: ${result.errors.map((e) => e.message).join('; ')}`);
          }
          writeFileSync(file, result.code);
        }
      },
    },
  };
}

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  preview: {
    headers: previewHeaders,
  },
  build: {
    // Für tools/check-bundle-size.mjs (Größe der Startansicht)
    manifest: true,
    // Kein Vorladen in index.html (D-344, Nachtrag): WebKit behält ein fehlgeschlagenes
    // Vorladen im Speicher, solange die alte Seite lebt; das Neuladen des Startwächters lud den
    // Teil dann gar nicht erst neu, und die App startete nicht. Chromium lädt vorgeladene Module
    // unter dem Service Worker ohnehin doppelt (E-16). Nachgeladene Bereiche laden weiter vor.
    modulePreload: {
      resolveDependencies: (_file, deps, { hostType }) => (hostType === 'html' ? [] : deps),
    },
  },
  define: {
    __APP_ENV__: JSON.stringify(appEnv),
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify(buildSha),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    slimStartView(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      // Marke FORM (D-309): Icons aus form-app-assets, Nacht als Hintergrund- und Theme-Farbe.
      // Die Skripte im Kopf erfasst globPatterns aus dist, also verkleinert (D-396); aus public/
      // kämen sie ein zweites Mal mit anderer Prüfsumme dazu.
      includeAssets: [
        'robots.txt',
        'icons/favicon.svg',
        'icons/favicon.ico',
        'icons/favicon-16.png',
        'icons/favicon-32.png',
        'icons/apple-touch-icon.png',
      ],
      manifest: {
        id: '/',
        name: 'FORM',
        short_name: 'FORM',
        description: 'Persönliche Fitnessplattform für Training, Körperdaten und Ernährung',
        lang: 'de',
        dir: 'ltr',
        start_url: '/heute',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0c1219',
        theme_color: '#0c1219',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // wasm: Barcode-Erkennung auch ohne Netz (D-266, rund 1,1 MB).
        // Liste der Übungsvisuals (D-397): klein, vorab gespeichert, damit Zuordnung und Rückfall
        // offline stimmen.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,txt,wasm}', 'uebungen/medien.json'],
        // Store-Größe und Rasterfassungen der Logos braucht die App nicht offline (SVGs reichen).
        // Startbilder lädt iOS selbst beim Hinzufügen zum Home-Bildschirm (D-317).
        // Bilder der Übungen nicht vorab (Auftrag Abschnitt 0.3), sondern bei Bedarf (runtimeCaching).
        globIgnores: [
          '**/icons/icon-1024.png',
          '**/brand/*.png',
          '**/splash/*.png',
          '**/uebungen/medien/**',
        ],
        // Bilder der Übungen beim ersten Anzeigen speichern, danach auch offline (D-397). Erst
        // Phase 2 bringt Dateien; die Regel steht schon, damit nichts vorab geladen wird.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/uebungen/medien/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'uebungen-medien',
              expiration: { maxEntries: 600 },
            },
          },
        ],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // Beim allerersten Start übernimmt der Service Worker die offene Seite sofort; sonst
        // kämen nachgeladene Teile bis zum Neuladen nur über das Netz (E-05, E-16, D-343).
        // Neue Versionen übernehmen weiter erst nach Bestätigung (registerType 'prompt').
        clientsClaim: true,
      },
      devOptions: { enabled: false },
    }),
  ],
});
