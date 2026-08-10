import { useEffect, useState } from 'preact/hooks';

export interface DialogCrumb {
  title: string;
  // Going back a level: `onClick` navigates within the dialog (e.g. a master
  // detail view returning to its list), and `target` (a palette action id) leaves the
  // dialog for the palette. The current (last) crumb omits both.
  onClick?: () => void;
  target?: string;
}

export interface DialogSpec {
  // The breadcrumb path at open time, current level last. The body may replace it
  // while open via the `setTrail` passed to `render`.
  trail: DialogCrumb[];
  // CSS for the body, injected into whichever root the dialog renders in (the
  // palette's shadow root, or the page for a standalone modal).
  styles?: string;
  // Builds the dialog body into `host`; the returned teardown runs on close.
  // `setTrail` replaces the breadcrumb, so a view with internal depth can reflect
  // it without reopening the dialog.
  render: (
    host: HTMLElement,
    close: () => void,
    setTrail: (trail: DialogCrumb[]) => void,
  ) => (() => void) | void;
}

let active: DialogSpec | null = null;
// Held apart from `active` so a trail change re-renders the breadcrumb without
// changing the spec identity (which would re-run the body render effect).
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
