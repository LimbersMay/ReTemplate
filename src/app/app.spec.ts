import { TestBed } from '@angular/core/testing';
import { render } from '@testing/dom';
import { translate, translocoTestingModule } from '@testing/transloco';
import { App } from './app';

async function setup() {
  TestBed.configureTestingModule({ imports: [translocoTestingModule()] });
  return render(App);
}

describe('App', () => {
  it('shows the product name in the header', async () => {
    const { view } = await setup();

    expect(view.getByText(translate('app.name'))).toBeTruthy();
  });

  it('shows the empty state until the first view exists', async () => {
    const { view } = await setup();

    expect(view.getByText(translate('app.empty.title'))).toBeTruthy();
  });
});
