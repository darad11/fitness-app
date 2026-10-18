import { clsx, type ClassValue } from 'clsx';

/** Klassen zusammensetzen; Bedingungen und Listen wie bei clsx. */
export function cn(...values: ClassValue[]): string {
  return clsx(values);
}
