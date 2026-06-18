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
  return (unsafeWindow as unknown as { E621?: { Toast?: E621Toast } }).E621?.Toast;
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
  update: (message: string) => void;
  finish: (message: string) => void;
}

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
