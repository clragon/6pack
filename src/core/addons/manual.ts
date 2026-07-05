import type { Action } from '../actions/types';
import type { SettingSpec } from '../settings';

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
