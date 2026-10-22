import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err: unknown) => {
  // eslint-disable-next-line no-console -- a failed bootstrap has no UI to report to.
  console.error(err);
});
