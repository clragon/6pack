import type { Action } from './types';
import type { PageContext } from '../context/types';

export class ActionRegistry {
  private readonly actions: Action[] = [];

  register(...actions: Action[]): void {
    this.actions.push(...actions);
  }

  available(page: PageContext): Action[] {
    return this.actions.filter((action) => !action.when || action.when(page));
  }
}
