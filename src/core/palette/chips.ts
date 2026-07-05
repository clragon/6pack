import type { Action, ActionContext } from '../actions/types';

// Context chips: small affordances above the palette input for ambient state that
// isn't tied to the current page, like a ticket open in another tab or (later) the
// burn pile's "N selected". A chip is a label plus the actions you get when you
// open it, which the palette pushes as a level so chips reuse the whole nav stack.
//
// Sources register their chips here; the palette renders the union and re-renders
// when any source changes. This keeps the palette generic: it knows about chips,
// not about tickets.

export interface Chip {
  id: string;
  label: string;
  // Key facts shown as a small section while the chip's menu is open, so you can
  // see what you're acting on. The face stays minimal (just the label).
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

// A chip is a group action wearing a face: its menu is the group's submenu. The
// palette surfaces chips as root rows through this so the keyboard reaches them,
// while the chip strip stays a quick mouse affordance for the same thing.
export function chipToAction(chip: Chip): Action {
  return {
    id: chip.id,
    title: chip.label,
    description: chip.info?.map((fact) => fact.value).join(' · ') || undefined,
    // Lead the root list, above the weight ceiling other actions use: ambient
    // state you likely opened the palette to deal with, mirroring the chip strip.
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
