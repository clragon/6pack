// Run once the DOM is parsed. At document-start the body isn't built yet, so
// callers that read or mount into the page defer to DOMContentLoaded, and past
// that point they run straight away.
export function whenReady(run: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => run(), { once: true });
  } else {
    run();
  }
}
