// In-memory ring buffer. Surfaced through the Diagnostics command so logs live
// in the palette, not the dev console.
export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  time: number;
  level: LogLevel;
  message: string;
}

const entries: LogEntry[] = [];
const MAX = 200;

function push(level: LogLevel, message: string): void {
  entries.push({ time: Date.now(), level, message });
  if (entries.length > MAX) entries.shift();
}

export const log = {
  info: (message: string) => push('info', message),
  warn: (message: string) => push('warn', message),
  error: (message: string) => push('error', message),
  entries: (): LogEntry[] => entries.slice(),
};
