import { readJson, writeJson } from './storage';

export interface TriggerConfig {
  key: string;
  // Ctrl on Windows/Linux, Cmd on macOS.
  mod?: boolean;
  alt?: boolean;
  shift?: boolean;
}

const STORAGE_KEY = 'sp.palette.trigger';

// Alt+Q: free on e621 (its hotkeys define no Alt combos) and unclaimed by the
// browser, unlike Ctrl/Cmd+K (Firefox search bar) or Ctrl/Cmd+Q (quits Firefox
// and the browser on macOS).
const DEFAULT_TRIGGER: TriggerConfig = { key: 'q', alt: true };

const MODIFIER_KEYS = new Set(['Control', 'Meta', 'Alt', 'Shift']);

export function getTrigger(): TriggerConfig {
  return readJson(STORAGE_KEY, DEFAULT_TRIGGER);
}

export function setTrigger(trigger: TriggerConfig): void {
  writeJson(STORAGE_KEY, trigger);
}

function keyMatches(event: KeyboardEvent, key: string): boolean {
  // Match the physical key so Option+Q on macOS (which reports "œ") still works.
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

// Build a trigger from a pressed combination. Returns null while only modifier
// keys are held, so the caller keeps waiting for the real key.
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
