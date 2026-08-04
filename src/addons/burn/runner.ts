import { progress } from '../../site/toast';
import { resourceName } from '../../core/resource';
import {
  getBurn,
  hasPending,
  listBurns,
  readLease,
  removeBurn,
  setTargetStatus,
  subscribe,
  writeLease,
  type Burn,
} from './queue';
import { burnTarget } from './execute';
import { installBurnChip } from './chip';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const THROTTLE_MS = 500;
const LEASE_TTL_MS = 3000;
const WATCH_MS = 1500;

const localTabId = crypto.randomUUID();
let draining = false;

function owned(): boolean {
  return readLease()?.tabId === localTabId;
}

function heartbeat(): void {
  writeLease({ tabId: localTabId, heartbeat: Date.now() });
}

async function acquire(): Promise<boolean> {
  const lease = readLease();
  const stale = !lease || Date.now() - lease.heartbeat > LEASE_TTL_MS;
  if (lease && lease.tabId !== localTabId && !stale) return false;
  heartbeat();
  await delay(50 + Math.floor(Math.random() * 100));
  return owned();
}

function handled(burn: Burn): number {
  return burn.targets.filter((target) => target.status !== 'pending').length;
}

function pendingBurn(): Burn | undefined {
  return listBurns().find((burn) =>
    burn.targets.some((target) => target.status === 'pending'),
  );
}

async function drainBurn(id: string): Promise<boolean> {
  const start = getBurn(id);
  if (!start) return true;
  const total = start.targets.length;
  const noun = (count: number) => resourceName(start.type, count);
  const fire = progress(
    `Burning ${handled(start)} of ${total} ${noun(total)}...`,
  );

  for (;;) {
    const burn = getBurn(id);
    if (!burn) {
      fire.finish('Cancelled.');
      return true;
    }
    const index = burn.targets.findIndex(
      (target) => target.status === 'pending',
    );
    if (index === -1) {
      const failed = burn.targets.filter((t) => t.status === 'failed').length;
      const done = handled(burn) - failed;
      fire.finish(
        `Burned ${done} ${noun(done)}.${failed ? ` ${failed} failed.` : ''}`,
      );
      if (failed === 0) removeBurn(id);
      return true;
    }
    heartbeat();
    try {
      await burnTarget(burn, burn.targets[index].id);
      setTargetStatus(id, index, 'done');
    } catch {
      setTargetStatus(id, index, 'failed');
    }
    const now = getBurn(id) ?? burn;
    fire.update(`Burning ${handled(now)} of ${total} ${noun(total)}...`);
    await delay(THROTTLE_MS);
    if (!owned()) {
      fire.finish('Handed off.');
      return false;
    }
  }
}

async function drain(): Promise<void> {
  if (draining) return;
  if (!hasPending()) return;
  draining = true;
  try {
    if (!(await acquire())) return;
    while (hasPending()) {
      const burn = pendingBurn();
      if (!burn) break;
      const keepGoing = await drainBurn(burn.id);
      if (!keepGoing) break;
    }
  } finally {
    draining = false;
    if (owned()) writeLease(null);
  }
}

export function installBurnRunner(): () => void {
  installBurnChip();
  const unsubscribe = subscribe(() => void drain());
  const timer = setInterval(() => void drain(), WATCH_MS);
  const release = (): void => {
    if (owned()) writeLease(null);
  };
  window.addEventListener('beforeunload', release);
  void drain();
  return () => {
    unsubscribe();
    clearInterval(timer);
    window.removeEventListener('beforeunload', release);
    release();
  };
}
