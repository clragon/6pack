import { readJson, writeJson } from './storage';

export interface TriggerConfig {
  key: string;
  mod?: boolean;
  alt?: boolean;
  shift?: boolean;
}

const STORAGE_KEY = 'sp.core.palette.trigger';

// e621's HotkeysConfig binds no Alt combination, and browsers claim Ctrl+K and
// Ctrl+Q with their Cmd forms, so Alt+Q reaches the palette unopposed.
const DEFAULT_TRIGGER: TriggerConfig = { key: 'q', alt: true };

const MODIFIER_KEYS = new Set(['Control', 'Meta', 'Alt', 'Shift']);

export function getTrigger(): TriggerConfig {
  return readJson(STORAGE_KEY, DEFAULT_TRIGGER);
}

export function setTrigger(trigger: TriggerConfig): void {
  writeJson(STORAGE_KEY, trigger);
}

function keyMatches(event: KeyboardEvent, key: string): boolean {
  // macOS reports Option+Q as event.key "œ", so letters match on event.code.
  if (/^[a-z]$/i.test(key)) return event.code === `Key${key.toUpperCase()}`;
  return event.key.toLowerCase() === key.toLowerCase();
}

export function triggerIsModless(): boolean {
  const trigger = getTrigger();
  return !trigger.mod && !trigger.alt && !trigger.shift;
}

export function matchesTrigger(event: KeyboardEvent): boolean {
  const trigger = getTrigger();
  if (!keyMatches(event, trigger.key)) return false;
  if (!!trigger.mod !== (event.ctrlKey || event.metaKey)) return false;
  if (!!trigger.alt !== event.altKey) return false;
  if (!!trigger.shift !== event.shiftKey) return false;
  return true;
}

export function triggerFromEvent(event: KeyboardEvent): TriggerConfig | null {
  if (MODIFIER_KEYS.has(event.key)) return null;
  let key: string;
  if (/^Key[A-Z]$/.test(event.code)) key = event.code.slice(3).toLowerCase();
  else if (/^Digit\d$/.test(event.code)) key = event.code.slice(5);
  else key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  return {
    key,
    mod: event.ctrlKey || event.metaKey,
    alt: event.altKey,
    shift: event.shiftKey,
  };
}

export function formatTrigger(trigger: TriggerConfig = getTrigger()): string {
  const parts: string[] = [];
  if (trigger.mod) parts.push('Ctrl/Cmd');
  if (trigger.alt) parts.push('Alt');
  if (trigger.shift) parts.push('Shift');
  parts.push(
    trigger.key.length === 1 ? trigger.key.toUpperCase() : trigger.key,
  );
  return parts.join('+');
}
