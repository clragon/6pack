import type { Action } from '../core/actions/types';
import { addonManuals } from '../core/addons/manual';
import { settings, type SettingSpec } from '../core/settings';
import { captureStore } from '../core/palette/store';

function keywordsOf(specs: SettingSpec[]): string[] {
  return specs.flatMap((spec) => [
    spec.label.toLowerCase(),
    ...(spec.keywords ?? []),
  ]);
}

function toSwitch(spec: SettingSpec): Action {
  return {
    id: `settings.${spec.key}`,
    title: spec.label,
    description: spec.description,
    keywords: spec.keywords,
    checked: () => settings.get(spec.key),
    run: () => {
      settings.toggle(spec.key);
    },
  };
}

export const settingsActions: Action[] = [
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure 6pack',
    keywords: ['settings', 'preferences', 'config', 'options'],
    hidden: true,
    weight: -1,
    submenu: () => {
      const owners = addonManuals().filter(
        (manual) => manual.settings.length > 0,
      );
      const owned = new Set(
        owners.flatMap((manual) => manual.settings.map((spec) => spec.key)),
      );
      const core = settings.specs().filter((spec) => !owned.has(spec.key));
      return [
        {
          id: 'settings.core',
          title: '6pack',
          description: 'The palette itself',
          drillOnly: true,
          keywords: [
            '6pack',
            'palette',
            'hotkey',
            'shortcut',
            'keybind',
            'rebind',
            'trigger',
            ...keywordsOf(core),
          ],
          submenu: () => [
            ...core.map(toSwitch),
            {
              id: 'palette.rebind',
              title: 'Change palette hotkey',
              description: 'Press a new key combination to open this palette',
              keywords: ['hotkey', 'shortcut', 'keybind', 'rebind', 'trigger'],
              run: () => {
                captureStore.set(true);
              },
            },
          ],
        },
        ...owners.map(
          (manual): Action => ({
            id: `settings.addon.${manual.id}`,
            title: manual.name,
            drillOnly: true,
            keywords: [
              manual.name.toLowerCase(),
              ...keywordsOf(manual.settings),
            ],
            submenu: () => manual.settings.map(toSwitch),
          }),
        ),
      ];
    },
  },
];
