import { Binding, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoundFunctions, queries, within } from '@testing-library/dom';
import { userEvent } from '@testing-library/user-event';

/** A rendered component: Testing Library queries scoped to it and user interactions. */
export interface Rendered<T> {
  fixture: ComponentFixture<T>;
  view: BoundFunctions<typeof queries>;
  click(element: Element): Promise<void>;
  type(element: Element, text: string): Promise<void>;
  clear(element: Element): Promise<void>;
  /** Keys on the focused element, in user-event syntax (`'{Enter}'`, `' '`). */
  keyboard(keys: string): Promise<void>;
  /** Moves the focus like Tab, or Shift+Tab with `{ shift: true }`. */
  tab(options?: { shift: boolean }): Promise<void>;
}

/**
 * Creates the component with its bindings, waits for the first render, and returns the queries and
 * interactions. Every interaction waits for `whenStable()` before resolving, so the DOM read after
 * it is already up to date (zoneless).
 */
export async function render<T>(
  component: Type<T>,
  { bindings = [] }: { bindings?: Binding[] } = {},
): Promise<Rendered<T>> {
  const fixture = TestBed.createComponent(component, { bindings });
  await fixture.whenStable();

  // Fake timers (vi.useFakeTimers) would stop user-event's internal delays.
  const user = userEvent.setup({
    advanceTimers: (ms) => {
      if (vi.isFakeTimers()) vi.advanceTimersByTime(ms);
    },
  });
  const settle = async (interaction: Promise<void>): Promise<void> => {
    await interaction;
    await fixture.whenStable();
  };

  return {
    fixture,
    view: within(fixture.nativeElement as HTMLElement),
    click: (element) => settle(user.click(element)),
    type: (element, text) => settle(user.type(element, text)),
    clear: (element) => settle(user.clear(element)),
    keyboard: (keys) => settle(user.keyboard(keys)),
    tab: (options) => settle(user.tab(options)),
  };
}
