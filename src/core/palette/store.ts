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
// Active while the rebind command is waiting for the user's next key combo.
export const captureStore = createToggle();

let pendingTarget: string | null = null;

// Open the palette drilled straight into a group action (by id), for inline
// affordances like the burn controls' "Incinerate..." button.
export function openPaletteAt(actionId: string): void {
  pendingTarget = actionId;
  paletteStore.set(true);
}

// Consumed by the palette when it opens, where null means open at root as usual.
export function takePaletteTarget(): string | null {
  const target = pendingTarget;
  pendingTarget = null;
  return target;
}
