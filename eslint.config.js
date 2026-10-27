import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Modulgrenzen (architecture.md Abschnitt 4, D-232)
const noAppImports = {
  group: ['@/app', '@/app/**'],
  message: 'Nur die App-Shell darf aus src/app importieren.',
};
const noModuleImports = {
  group: ['@/modules', '@/modules/**'],
  message: 'src/shared darf nicht aus Fachmodulen importieren.',
};
const noDeepModuleImports = {
  group: ['@/modules/*/**'],
  message: 'Andere Module nur über ihre öffentliche Schnittstelle importieren: @/modules/<name>.',
};
const pureCodeImports = {
  paths: ['react', 'react-dom', 'dexie', 'dexie-react-hooks'],
  message: 'model/ und calc/ bleiben frei von React und Dexie.',
};

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      'coverage',
      'playwright-report',
      'test-results',
      'docs/archive',
      'public/theme-init.js',
      'public/startflaeche.js',
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.js', 'tools/*.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noAppImports, noModuleImports] }],
    },
  },
  {
    files: ['src/modules/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noAppImports, noDeepModuleImports] }],
    },
  },
  {
    files: ['src/modules/*/model/**/*.ts', 'src/modules/*/calc/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: pureCodeImports.paths.map((name) => ({ name, message: pureCodeImports.message })),
          patterns: [noAppImports, noDeepModuleImports],
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);
