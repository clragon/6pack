import type { Action } from '../core/actions/types';
import { diagReadings } from '../core/diag';
import { loadCurrentUser } from '../site/user';

export const diagnostics: Action = {
  id: 'diagnostics',
  title: 'Diagnostics',
  description: 'Values the tools read this load, for debugging',
  keywords: ['diagnostics', 'debug', 'signals', 'health', 'status', 'readings'],
  hidden: true,
  weight: -5,
  submenu: () => {
    void loadCurrentUser();
    const readings = diagReadings();
    if (readings.length === 0) {
      return [
        {
          id: 'diagnostics.empty',
          title: 'No readings yet',
          submenuOnly: true,
        },
      ];
    }
    return readings.map(([label, value], index) => {
      const text = `${label}: ${value}`;
      return {
        id: `diagnostics.row.${index}`,
        title: text,
        keywords: [text],
        submenuOnly: true,
        run: () => {
          void navigator.clipboard.writeText(text);
        },
      };
    });
  },
};
