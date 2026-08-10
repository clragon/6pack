import type { Action } from './types';
import type { PageContext } from '../context/types';
import { log } from '../log';

export class ActionRegistry {
  private readonly actions: Action[] = [];
  private readonly ids = new Set<string>();

  // An id claimed twice keeps the first registration, as settings specs and
  // add-ons do. Ids reach the frecency store, so a second holder would rank and
  // surface against the first one's history.
  register(...actions: Action[]): void {
    for (const action of actions) {
      if (this.ids.has(action.id)) {
        log.warn(`action ${action.id} already registered, ignoring`);
        continue;
      }
      this.ids.add(action.id);
      this.actions.push(action);
    }
  }

  available(page: PageContext): Action[] {
    return this.actions.filter((action) => {
      if (!action.when) return true;
      // A precondition that throws means the feature can't establish whether it
      // can load: treat it as unavailable and fail silently (log only).
      try {
        return action.when(page);
      } catch (error) {
        log.warn(`${action.id} precondition failed: ${describe(error)}`);
        return false;
      }
    });
  }
}

function describe(error: unknown): string {
  return error instanceof Error
    ? (error.stack ?? error.message)
    : String(error);
}
