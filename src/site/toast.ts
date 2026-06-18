// Thin wrapper over e621's global Toast (E621.Toast). Our GM_* grants put the
// script in the manager's sandbox, where `window` is not the page's, so we reach
// the page global through unsafeWindow. Its absence means we can't give the user
// feedback at all, so we treat it as a fatal condition (alarm in the palette)
// and still log the message that couldn't be shown.
import { unsafeWindow } from 'vite-plugin-monkey/dist/client';
import { log } from '../core/log';
import { reportFatal } from '../core/palette/banner';

const TOAST_GONE = 'e621 Toast is unavailable, feedback is broken';

interface E621ToastInstance {
  rewrite?: (message: string, opts?: { timeout?: number }) => void;
}

interface E621Toast {
  notice?: (message: string, permanent?: boolean) => void;
  alert?: (message: string) => void;
  create?: (message: string, opts?: { timeout?: number }) => E621ToastInstance;
}

function toast(): E621Toast | undefined {
  return (unsafeWindow as unknown as { E621?: { Toast?: E621Toast } }).E621
    ?.Toast;
}

export function notify(message: string): void {
  const t = toast();
  if (t?.notice) t.notice(message);
  else {
    log.info(message);
    reportFatal(TOAST_GONE);
  }
}

export function notifyError(message: string): void {
  const t = toast();
  if (t?.alert) t.alert(message);
  else {
    log.error(message);
    reportFatal(TOAST_GONE);
  }
}

export interface Progress {
  // Rewrite the live toast (e.g. "Burning 3 of 10...").
  update: (message: string) => void;
  // Final message; lets the toast time out.
  finish: (message: string) => void;
}

// A single rewritable toast for long-running work. Falls back to plain notices
// when e621's rewritable Toast isn't available.
export function progress(message: string): Progress {
  const instance = toast()?.create?.(message, { timeout: 0 });
  if (!instance?.rewrite) {
    notify(message);
    return { update: () => {}, finish: (final) => notify(final) };
  }
  return {
    update: (next) => instance.rewrite?.(next, { timeout: 0 }),
    finish: (final) => instance.rewrite?.(final, { timeout: 5 }),
  };
}
