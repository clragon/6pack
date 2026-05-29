import { log } from '../core/log';
import { reportFatal } from '../core/palette/banner';

const TOAST_GONE = 'e621 Toast is unavailable, feedback is broken';

interface E621Toast {
  notice?: (message: string, permanent?: boolean) => void;
  alert?: (message: string) => void;
}

function toast(): E621Toast | undefined {
  return (window as unknown as { E621?: { Toast?: E621Toast } }).E621?.Toast;
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
