import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';

/** The popup window. Until the shell slice replaces it, it only shows the product and an empty state. */
@Component({
  selector: 'app-root',
  imports: [TranslocoDirective, NgIcon],
  templateUrl: './app.html',
  host: { class: 're-app' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
