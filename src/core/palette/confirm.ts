import { useEffect, useState } from 'preact/hooks';

export interface ConfirmField {
  key: string;
  label: string;
  value?: string;
  placeholder?: string;
  numeric?: boolean;
}

export interface ConfirmOption {
  key: string;
  label: string;
  default?: boolean;
}

export interface ConfirmRequest {
  title: string;
  detail?: string;
  confirmLabel?: string;
  fields?: ConfirmField[];
  options?: ConfirmOption[];
}

export interface ConfirmResult {
  fields: Record<string, string>;
  options: Record<string, boolean>;
}

interface ActiveRequest extends ConfirmRequest {
  resolve: (result: ConfirmResult | null) => void;
}

let active: ActiveRequest | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

// Opens the confirm overlay and resolves with the user's input, or null if they
// cancel. Any in-flight request is cancelled first.
export function openConfirm(
  request: ConfirmRequest,
): Promise<ConfirmResult | null> {
  active?.resolve(null);
  return new Promise((resolve) => {
    active = { ...request, resolve };
    emit();
  });
}

export function resolveConfirm(result: ConfirmResult | null): void {
  const request = active;
  active = null;
  emit();
  request?.resolve(result);
}

export function isConfirmActive(): boolean {
  return active !== null;
}

export function useConfirm(): ActiveRequest | null {
  const [, force] = useState(0);
  useEffect(() => {
    const listener = () => force((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return active;
}
