import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      environment: 'node',
      setupFiles: ['./src/test-setup.ts'],
      restoreMocks: true,
      // tokens.css wird im Kontrasttest als Text gelesen; sonst liefert Vitest CSS leer aus.
      css: { include: [/tokens\.css/] },
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/main.tsx',
          'src/env.d.ts',
          'src/test-setup.ts',
          'src/shared/testing/**',
        ],
        reporter: ['text-summary', 'html'],
        // CI-Gates aus testing.md Abschnitt 5 (Zeilenabdeckung); reine Funktionen wie calc/.
        thresholds: {
          'src/shared/lib/**': { lines: 95 },
          'src/shared/db/**': { lines: 85 },
          'src/modules/*/calc/**': { lines: 95 },
          'src/modules/*/data/**': { lines: 85 },
          'src/modules/*/service/**': { lines: 85 },
        },
      },
    },
  }),
);
