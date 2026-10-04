import type { Locale } from './locale';

/** Prefer the locale string, then English, then an explicit fallback. */
export function pickLocale<T>(locale: Locale, table: Partial<Record<Locale, T>>, fallback: T): T {
  return table[locale] ?? table.en ?? fallback;
}
