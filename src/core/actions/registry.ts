import type { Action } from './types';
import type { PageContext } from '../context/types';
import { log } from '../log';

export class ActionRegistry {
  private readonly actions: Action[] = [];
  private readonly ids = new Set<string>();

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
