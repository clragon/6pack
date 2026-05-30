function createToggle() {
  let value = false;
  const listeners = new Set<() => void>();
  const store = {
    isOpen: (): boolean => value,
    set(next: boolean): void {
      if (value === next) return;
      value = next;
      for (const listener of listeners) listener();
    },
    toggle(): void {
      store.set(!value);
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return store;
}

export const paletteStore = createToggle();
export const captureStore = createToggle();

let pendingTarget: string | null = null;

export function openPaletteAt(actionId: string): void {
  pendingTarget = actionId;
  paletteStore.set(true);
}

export function takePaletteTarget(): string | null {
  const target = pendingTarget;
  pendingTarget = null;
  return target;
}
