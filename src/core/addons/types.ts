import type { Action } from '../actions/types';
import type { PageContext } from '../context/types';
import type { SettingSpec } from '../settings';

export interface AddonContext {
  page: PageContext;
}

export interface SixpackAddon {
  id: string;
  name: string;
  when?: (page: PageContext) => boolean;
  actions?: Action[] | ((page: PageContext) => Action[]);
  settings?: SettingSpec[];
  // The script runs at document-start and core/addons/loader.ts runs cached
  // add-ons synchronously, so DOM work in setup goes through whenReady.
  setup?: (ctx: AddonContext) => void | (() => void);
}
