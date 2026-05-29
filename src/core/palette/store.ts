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
