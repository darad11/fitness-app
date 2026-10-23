import {
  getDoc,
  unknownFields,
  upsertDoc,
  type AppDb,
  type DbRuntime,
  type DocDef,
} from '@/shared/db';
import { stableId } from '@/shared/lib/uuid';
import {
  PROFILE_DEFAULTS,
  PROFILE_SCHEMA_VERSION,
  profileDataSchema,
  profileSchema,
  type Profile,
  type ProfileData,
} from '../model/profile';

export const PROFILE_ID = stableId('singleton:profile');

export const profileDef: DocDef<Profile> = {
  type: 'profile',
  schemaVersion: PROFILE_SCHEMA_VERSION,
  schema: profileSchema,
  table: (db) => db.singletons,
};

export async function loadProfile(db: AppDb): Promise<ProfileData> {
  const doc = await getDoc(db, profileDef, PROFILE_ID);
  return doc ? profileDataSchema.parse(doc) : PROFILE_DEFAULTS;
}

/** Setzt oder leert den Anzeigenamen. */
export async function saveProfile(
  rt: DbRuntime,
  patch: { displayName?: string },
): Promise<ProfileData> {
  const name = patch.displayName?.trim();
  const doc = await upsertDoc(rt, profileDef, PROFILE_ID, (current) => {
    // Felder einer neueren App-Version bleiben erhalten (A-03).
    const base = current
      ? { ...unknownFields(current, profileDataSchema), ...profileDataSchema.parse(current) }
      : PROFILE_DEFAULTS;
    const { displayName: _old, ...rest } = base;
    return { ...rest, ...(name ? { displayName: name } : {}) };
  });
  return profileDataSchema.parse(doc);
}
