import type { Action } from '../actions/types';
import type { SettingSpec } from '../settings';

// Per-add-on help data, recorded as each add-on registers and read live by the
// Help panel.
export interface AddonManual {
  id: string;
  name: string;
  description?: string;
  actions: Action[];
  settings: SettingSpec[];
}

const manuals: AddonManual[] = [];

export function registerManual(manual: AddonManual): void {
  if (manuals.some((entry) => entry.id === manual.id)) return;
  manuals.push(manual);
}

export function addonManuals(): AddonManual[] {
  return manuals;
}
