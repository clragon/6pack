// Thin wrapper over e621's global Toast (window.E621.Toast). We run in the page
// context, so the global is directly reachable. No-ops if it's ever absent.
interface E621Toast {
  notice?: (message: string, permanent?: boolean) => void;
  alert?: (message: string) => void;
}

function toast(): E621Toast | undefined {
  return (window as unknown as { E621?: { Toast?: E621Toast } }).E621?.Toast;
}

export function notify(message: string): void {
  toast()?.notice?.(message);
}

export function notifyError(message: string): void {
  toast()?.alert?.(message);
}
