import type { Action, ActionContext } from '../actions/types';

// Context chips: affordances above the palette input for ambient state not tied to
// the current page. Sources register chips here; the palette renders the union and
// re-renders when a source changes.

export interface Chip {
  id: string;
  label: string;
  // Facts shown while the chip's menu is open.
  info?: Array<{ label: string; value: string }>;
  // The menu shown when the chip is opened.
  open: (ctx: ActionContext) => Action[];
}

export interface ChipSource {
  list(): Chip[];
  subscribe(listener: () => void): () => void;
  // Re-poll volatile state (e.g. ask other tabs to re-announce) when the palette
  // opens. Optional: static sources need nothing.
  refresh?(): void;
}

const sources: ChipSource[] = [];

export function registerChipSource(source: ChipSource): void {
  sources.push(source);
}

export function chipToAction(chip: Chip): Action {
  return {
    id: chip.id,
    title: chip.label,
    description: chip.info?.map((fact) => fact.value).join(' · ') || undefined,
    // Above the weight ceiling other actions use, so chips lead the root list.
    weight: 3,
    submenu: (ctx) => chip.open(ctx),
  };
}

export function allChips(): Chip[] {
  return sources.flatMap((source) => source.list());
}

export function subscribeChips(listener: () => void): () => void {
  const unsubs = sources.map((source) => source.subscribe(listener));
  return () => {
    for (const unsub of unsubs) unsub();
  };
}

export function refreshChips(): void {
  for (const source of sources) source.refresh?.();
}
