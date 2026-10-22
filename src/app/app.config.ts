import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { provideIcons } from '@ng-icons/core';
import { firstValueFrom } from 'rxjs';

import { APP_ICONS } from './icons';
import { TranslocoHttpLoader } from './transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['es', 'en'],
        defaultLang: 'es',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    // Loads the default dictionary before the first render, so the popup never shows raw keys.
    provideAppInitializer(() => firstValueFrom(inject(TranslocoService).load('es'))),
    // Every icon of the app, registered once. Components only import NgIcon.
    provideIcons(APP_ICONS),
  ],
};
