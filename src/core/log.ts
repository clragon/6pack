import { readJson, writeJson } from './storage';

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  time: number;
  level: LogLevel;
  message: string;
}

const KEY = 'sixpack.log';
const MAX = 200;
const RETENTION_MS = 60 * 60 * 1000;

function trim(now: number): void {
  while (entries.length && now - entries[0].time > RETENTION_MS) entries.shift();
  while (entries.length > MAX) entries.shift();
}

const entries: LogEntry[] = readJson<LogEntry[]>(KEY, []);
trim(Date.now());

function push(level: LogLevel, message: string): void {
  const now = Date.now();
  entries.push({ time: now, level, message });
  trim(now);
  writeJson(KEY, entries);
}

export const log = {
  info: (message: string) => push('info', message),
  warn: (message: string) => push('warn', message),
  error: (message: string) => push('error', message),
  entries: (): LogEntry[] => entries.slice(),
};
