import { useEffect, useState } from 'preact/hooks';

export interface DialogCrumb {
  title: string;
  onClick?: () => void;
  target?: string;
}

export interface DialogSpec {
  trail: DialogCrumb[];
  styles?: string;
  render: (
    host: HTMLElement,
    close: () => void,
    setTrail: (trail: DialogCrumb[]) => void,
  ) => (() => void) | void;
}

let active: DialogSpec | null = null;
let activeTrail: DialogCrumb[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function openDialog(spec: DialogSpec): () => void {
  active = spec;
  activeTrail = spec.trail;
  emit();
  return closeDialog;
}

export function closeDialog(): void {
  if (!active) return;
  active = null;
  activeTrail = [];
  emit();
}

export function setDialogTrail(trail: DialogCrumb[]): void {
  if (!active) return;
  activeTrail = trail;
  emit();
}

export function dialogTrail(): DialogCrumb[] {
  return activeTrail;
}

export function isDialogActive(): boolean {
  return active !== null;
}

export function useDialog(): DialogSpec | null {
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
