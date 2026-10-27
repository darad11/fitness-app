import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
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
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      // Marke FORM (D-309): Icons aus form-app-assets, Nacht als Hintergrund- und Theme-Farbe.
      includeAssets: [
        'theme-init.js',
        'startflaeche.js',
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
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,txt,wasm}'],
        // Store-Größe und Rasterfassungen der Logos braucht die App nicht offline (SVGs reichen).
        // Startbilder lädt iOS selbst beim Hinzufügen zum Home-Bildschirm (D-317).
        globIgnores: ['**/icons/icon-1024.png', '**/brand/*.png', '**/splash/*.png'],
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
