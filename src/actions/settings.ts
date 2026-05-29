import type { Action } from '../core/actions/types';
import { captureStore } from '../core/palette/store';

export const settingsActions: Action[] = [
  {
    id: 'palette.rebind',
    title: 'Change palette hotkey',
    description: 'Press a new key combination to open this palette',
    keywords: ['hotkey', 'shortcut', 'keybind', 'rebind', 'trigger', 'settings'],
    weight: -1,
    run: () => {
      captureStore.set(true);
    },
  },
];
