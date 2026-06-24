import type { Action } from '../actions/types';
import type { PageContext } from '../context/types';
import type { SettingSpec, SettingsApi } from '../settings';

export interface AddonContext {
  page: PageContext;
  // Shared services, injected so a managed add-on never imports core (which would
  // bundle disconnected copies of stateful singletons).
  settings: SettingsApi;
}

// The one contract every contributor registers through: core, first-party
// add-ons, and third-party hooks alike. There is no privileged path; the only
// difference between them is how their code reaches the host (runtime loaded by
// the manager, or a separate userscript bridging in via unsafeWindow.sixpack).
export interface SixpackAddon {
  id: string;
  name: string;
  // Gate `setup` to the relevant pages. Absent means run everywhere. Actions
  // carry their own `when`, so this gates the DOM lifecycle, not the commands.
  when?: (page: PageContext) => boolean;
  // Command-menu entries. A function form receives the page for contextual sets.
  actions?: Action[] | ((page: PageContext) => Action[]);
  // Preferences the add-on owns; each becomes a switch in the settings submenu.
  settings?: SettingSpec[];
  // Imperative DOM lifecycle (observers, injection). The returned teardown runs
  // when the manager unloads the add-on (e.g. the user disables it).
  setup?: (ctx: AddonContext) => void | (() => void);
}

// The object injected into a managed add-on's code as `sixpack`, and published on
// unsafeWindow for third-party hooks. The sole entry point into the palette.
export interface SixpackApi {
  version: number;
  register(addon: SixpackAddon): void;
}
