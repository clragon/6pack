import type { Action } from '../actions/types';
import type { PageContext } from '../context/types';
import type { DialogSpec } from '../palette/dialog';
import type { SettingSpec, SettingsApi } from '../settings';
import type { TicketResponseProvider } from '../tickets/providers';

export interface AddonContext {
  page: PageContext;
  settings: SettingsApi;
  whenReady: (run: () => void) => void;
}

export interface SixpackAddon {
  id: string;
  name: string;
  description?: string;
  when?: (page: PageContext) => boolean;
  actions?: Action[];
  settings?: SettingSpec[];
  ticketResponses?: TicketResponseProvider;
  // The script runs at document-start and core/addons/loader.ts runs cached
  // add-ons synchronously, so DOM work in setup goes through whenReady.
  setup?: (ctx: AddonContext) => void | (() => void);
}

export interface SixpackApi {
  version: number;
  register(addon: SixpackAddon): void;
  openDialog(spec: DialogSpec): () => void;
}
