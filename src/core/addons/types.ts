import type { Action } from '../actions/types';
import type { PageContext } from '../context/types';
import type { DialogSpec } from '../palette/dialog';
import type { SettingSpec, SettingsApi } from '../settings';
import type { TicketResponseProvider } from '../tickets/providers';

export interface AddonContext {
  page: PageContext;
  // Shared services, injected so a managed add-on never imports core (which would
  // bundle disconnected copies of stateful singletons).
  settings: SettingsApi;
  // Setup can run as early as document-start (a cached add-on registers before
  // the body exists), so inject styles synchronously but route DOM work here.
  whenReady: (run: () => void) => void;
}

// The one contract every contributor registers through: core, first-party
// add-ons, and third-party hooks alike. There is no privileged path; the only
// difference between them is how their code reaches the host (runtime loaded by
// the manager, or a separate userscript bridging in via unsafeWindow.sixpack).
export interface SixpackAddon {
  id: string;
  name: string;
  // Prose for the add-on's help page. Its commands and settings are listed there
  // from what it registers, so this is only the part they can't derive.
  description?: string;
  // Gate `setup` to the relevant pages. Absent means run everywhere. Actions
  // carry their own `when`, so this gates the DOM lifecycle, not the commands.
  when?: (page: PageContext) => boolean;
  // Command-menu entries. Each carries its own `when` gate; a dynamic set is a
  // group with a `submenu`, not a page-conditional registration.
  actions?: Action[];
  // Preferences the add-on owns; each becomes a switch in the settings submenu.
  settings?: SettingSpec[];
  // A source of ticket close responses, folded into the registry the close flow
  // reads. Declared like actions: the host registers it, and the provider stays
  // unaware of how or where a response it composes is used.
  ticketResponses?: TicketResponseProvider;
  // Imperative DOM lifecycle (observers, injection). The returned teardown runs
  // when the manager unloads the add-on (e.g. the user disables it).
  setup?: (ctx: AddonContext) => void | (() => void);
}

// The object injected into a managed add-on's code as `sixpack`, and published on
// unsafeWindow for third-party hooks. The sole entry point into the palette.
export interface SixpackApi {
  version: number;
  register(addon: SixpackAddon): void;
  // Render a dialog in the palette's chrome from add-on-supplied content, the way
  // an add-on reaches a real dialog without importing core. Returns a close handle.
  openDialog(spec: DialogSpec): () => void;
}
