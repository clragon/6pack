import { useEffect, useState } from 'preact/hooks';

interface ToggleStore {
  isOpen: () => boolean;
  subscribe: (listener: () => void) => () => void;
}

export function useToggle(store: ToggleStore): boolean {
  const [open, setOpen] = useState(store.isOpen());
  useEffect(() => store.subscribe(() => setOpen(store.isOpen())), [store]);
  return open;
}
