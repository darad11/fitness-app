/**
 * Build-Informationen. `VERCEL_ENV` unterscheidet Produktiv- und Vorschau-Deployments
 * (AK-PWA-07, sichtbar unter „Mehr“ › „Über die App“); lokal und in der CI gibt es eigene Werte.
 */

export type AppEnv = 'production' | 'preview' | 'development' | 'ci' | 'local';

const KNOWN_ENVS: readonly AppEnv[] = ['production', 'preview', 'development', 'ci', 'local'];

export function resolveAppEnv(raw: string): AppEnv {
  return (KNOWN_ENVS as readonly string[]).includes(raw) ? (raw as AppEnv) : 'local';
}

export interface AppInfo {
  readonly env: AppEnv;
  readonly version: string;
  readonly buildSha: string;
  readonly buildTime: string;
}

export const appInfo: AppInfo = {
  env: resolveAppEnv(__APP_ENV__),
  version: __APP_VERSION__,
  buildSha: __BUILD_SHA__,
  buildTime: __BUILD_TIME__,
};
