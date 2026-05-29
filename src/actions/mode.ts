import type { Action } from '../core/actions/types';
import { readModes, setMode } from '../site/mode';

const IMPORTANT = new Set(['approve', 'delete', 'view']);

export const mode: Action = {
  id: 'mode',
  title: 'Mode',
  description: 'Switch the post list mass-action mode',
  keywords: ['mode', 'mass', 'select', 'bulk', 'action'],
  when: () => readModes().length > 0,
  submenu: () =>
    readModes().map((option) => ({
      id: `mode.${option.value}`,
      title: option.label,
      keywords: [option.label, option.value],
      submenuOnly: !IMPORTANT.has(option.value),
      run: () => setMode(option.value),
    })),
};
