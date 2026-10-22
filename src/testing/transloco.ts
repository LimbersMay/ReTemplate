import { ModuleWithProviders } from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import en from '../assets/i18n/en.json';
import es from '../assets/i18n/es.json';

/** Transloco with the real dictionaries, loaded synchronously and active in English. */
export function translocoTestingModule(): ModuleWithProviders<TranslocoTestingModule> {
  return TranslocoTestingModule.forRoot({
    langs: { en, es },
    translocoConfig: { availableLangs: ['es', 'en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

/**
 * English text of a key, with its `{{params}}` filled in, to query the DOM by what the user reads.
 * Throws when the key does not exist, so a renamed key breaks the test instead of passing silently.
 */
export function translate(key: string, params: Record<string, unknown> = {}): string {
  const value = key.split('.').reduce<unknown>(
    (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
    en,
  );
  if (typeof value !== 'string') throw new Error(`Missing translation key: ${key}`);
  return value.replace(/{{\s*(\w+)\s*}}/g, (_, name: string) => String(params[name] ?? ''));
}
