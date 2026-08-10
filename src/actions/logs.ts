import type { Action } from '../core/actions/types';
import { log, type LogEntry } from '../core/log';

function format(entry: LogEntry): string {
  const time = new Date(entry.time).toLocaleTimeString();
  return `[${time}] ${entry.level}: ${entry.message}`;
}

// Reached by naming it outright ("logs", "log", "errors"). The buffer persists
// across reloads, and drilling in shows recent entries newest-first, each row
// copying its text.
export const logs: Action = {
  id: 'logs',
  title: 'Logs',
  description: 'Recent 6pack activity and failures',
  keywords: ['logs', 'log', 'errors', 'history', 'activity', 'debug'],
  secret: true,
  weight: -4,
  submenu: () => {
    const entries = log.entries();
    if (entries.length === 0) {
      return [
        {
          id: 'logs.empty',
          title: 'No log entries yet',
          submenuOnly: true,
        },
      ];
    }
    return entries.reverse().map((entry, index) => {
      const text = format(entry);
      return {
        id: `logs.row.${index}`,
        title: text,
        keywords: [text, entry.level],
        submenuOnly: true,
        run: () => {
          void navigator.clipboard.writeText(text);
        },
      };
    });
  },
};
