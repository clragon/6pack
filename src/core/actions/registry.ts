import type { Action } from './types';
import type { PageContext } from '../context/types';
import { log } from '../log';

export class ActionRegistry {
  private readonly actions: Action[] = [];

  register(...actions: Action[]): void {
    this.actions.push(...actions);
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
