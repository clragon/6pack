import type { Action } from '../core/actions/types';
import { diagReadings } from '../core/diag';
import { loadCurrentUser } from '../site/user';

// Reached by naming it outright ("diagnostics", "diag", "debug"). Shows the
// values the tools actually read this page load (see core/diag) rather than a
// re-derived snapshot, and each row copies its text. Recent log lines live in
// their own "Logs" command.
export const diagnostics: Action = {
  id: 'diagnostics',
  title: 'Diagnostics',
  description: 'Values the tools read this load, for debugging',
  keywords: [
    'diagnostics',
    'diag',
    'debug',
    'signals',
    'health',
    'status',
    'readings',
  ],
  secret: true,
  weight: -5,
  submenu: () => {
    // Retry the permission fetch if the startup load failed; a later open then
    // records the resolved user.
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
