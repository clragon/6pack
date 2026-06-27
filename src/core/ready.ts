export function whenReady(run: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => run(), { once: true });
  } else {
    run();
  }
}
