import { defineBackground } from 'wxt/utils/define-background';

/**
 * Service worker. It wires Chrome events to the engine and runs the actions the engine returns; it holds
 * no rules of its own (docs/architecture.md).
 */
export default defineBackground(() => {
  // The first slice that needs the service worker registers its listeners here.
});
