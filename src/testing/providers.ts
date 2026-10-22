import { provideZonelessChangeDetection } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { APP_ICONS } from '../app/icons';

/** Providers of every TestBed: zoneless, like the app, and the same icons `app.config.ts` registers. */
export default [provideZonelessChangeDetection(), provideIcons(APP_ICONS)];
