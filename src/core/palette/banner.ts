import { useEffect, useState } from 'preact/hooks';
import { log } from '../log';

const fatals = new Set<string>();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function reportFatal(message: string): void {
  if (fatals.has(message)) return;
  fatals.add(message);
  log.error(`fatal: ${message}`);
  emit();
}

export function useFatals(): string[] {
  const [, force] = useState(0);
  useEffect(() => {
    const listener = () => force((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return [...fatals];
}
