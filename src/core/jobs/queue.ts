import { readJson, writeJson } from '../storage';
import { openChannel } from '../tabs/channel';
import type { BurnableType } from '../../site/burnable';

export type TargetStatus = 'pending' | 'done' | 'failed';

export interface BurnTarget {
  id: string;
  status: TargetStatus;
}

export interface Burn {
  id: string;
  type: BurnableType;
  targets: BurnTarget[];
  markType?: string;
  fields?: Record<string, string>;
}

export interface Lease {
  tabId: string;
  heartbeat: number;
}

const BURNS_KEY = 'sp.burns';
const LEASE_KEY = 'sp.burns.lease';

interface Stored {
  burns: Burn[];
}

let burns = readJson<Stored>(BURNS_KEY, { burns: [] }).burns;
const listeners = new Set<() => void>();
const channel = openChannel<{ kind: 'changed' }>('burns');

function notify(): void {
  for (const listener of listeners) listener();
}

function persist(): void {
  writeJson(BURNS_KEY, { burns });
  channel.post({ kind: 'changed' });
  notify();
}

channel.subscribe(() => {
  burns = readJson<Stored>(BURNS_KEY, { burns: [] }).burns;
  notify();
});

export function listBurns(): Burn[] {
  return burns;
}

export function getBurn(id: string): Burn | undefined {
  return burns.find((burn) => burn.id === id);
}

export function hasPending(): boolean {
  return burns.some((burn) =>
    burn.targets.some((target) => target.status === 'pending'),
  );
}

export function enqueue(burn: Omit<Burn, 'id'>): string {
  const id = crypto.randomUUID();
  burns = [...burns, { ...burn, id }];
  persist();
  return id;
}

export function setTargetStatus(
  burnId: string,
  index: number,
  status: TargetStatus,
): void {
  burns = burns.map((burn) => {
    if (burn.id !== burnId) return burn;
    const targets = burn.targets.map((target, i) =>
      i === index ? { ...target, status } : target,
    );
    return { ...burn, targets };
  });
  persist();
}

export function removeBurn(id: string): void {
  if (!burns.some((burn) => burn.id === id)) return;
  burns = burns.filter((burn) => burn.id !== id);
  persist();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readLease(): Lease | null {
  return readJson<Lease | null>(LEASE_KEY, null);
}

export function writeLease(lease: Lease | null): void {
  writeJson(LEASE_KEY, lease);
}
