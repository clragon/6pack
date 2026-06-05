import type { Action, ActionContext } from '../actions/types';

export interface Chip {
  id: string;
  label: string;
  info?: Array<{ label: string; value: string }>;
  open: (ctx: ActionContext) => Action[];
}

export interface ChipSource {
  list(): Chip[];
  subscribe(listener: () => void): () => void;
  refresh?(): void;
}

const sources: ChipSource[] = [];

export function registerChipSource(source: ChipSource): void {
  sources.push(source);
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
