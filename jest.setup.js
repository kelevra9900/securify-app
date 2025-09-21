// Use real timers by default; tests can opt-in to fake timers when needed.

// React Native preset uses __DEV__ checks in code
// Define it for test environment if not present
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.__DEV__ = true;

// Silence noisy console output during tests (opt-in per test to re-enable)
const origError = console.error;
const origWarn = console.warn;
beforeAll(() => {
  console.error = (...args) => {
    const msg = String(args[0] ?? '');
    if (msg.includes('Possible Unhandled')) return;
    origError(...args);
  };
  console.warn = (...args) => {
    const msg = String(args[0] ?? '');
    if (msg.includes('Animated:') || msg.includes('new NativeEventEmitter'))
      return;
    origWarn(...args);
  };
});
afterAll(() => {
  console.error = origError;
  console.warn = origWarn;
});
