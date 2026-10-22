// Global cleanup after every test, so specs never repeat it (docs/standards/testing/writing.md › Globales).
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
});
