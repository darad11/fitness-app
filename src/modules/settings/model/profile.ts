import { z } from 'zod';
import { defineDocSchema, ROOT_FIELD_MASK, type DocData } from '@/shared/db/documents';

/** Profil als Singleton (data-model.md 3.7, AK-SET-05): ohne Konto, Anzeigename optional. */
export const PROFILE_SCHEMA_VERSION = 1;
export const DISPLAY_NAME_MAX = 40;

export const profileSchema = defineDocSchema('profile', {
  displayName: z.string().trim().min(1).max(DISPLAY_NAME_MAX).optional(),
});

export type Profile = z.infer<typeof profileSchema>;
export type ProfileData = DocData<Profile>;
export const profileDataSchema = profileSchema.omit(ROOT_FIELD_MASK);
export const PROFILE_DEFAULTS: ProfileData = {};
