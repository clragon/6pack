// Janitor-work signals that e621 persists in localStorage. One reader per
// concern so a single moved key stays isolated.
import { probe } from '../core/diag';

// The "Approvals: On/Off" toolbar toggle (#janitor-toolbar-toggle) writes
// LStorage.Posts.JanitorToolbar to the legacy key "jtb" (boolean; the key is
// absent when off). It only exists for approvers, so it doubles as a clean
// "I am doing janitor work right now" gate that stays hidden for everyone else.
export const isApprovalsEnabled = probe('approvals enabled', (): boolean => {
  try {
    return localStorage.getItem('jtb') === 'true';
  } catch {
    return false;
  }
});

// The post mode menu's current selection (legacy key "mode"; absent at the
// default "view"), stored as a bare string.
export function readRawMode(): string | null {
  try {
    return localStorage.getItem('mode');
  } catch {
    return null;
  }
}

// The post mode menu set to "approve" (bulk-approve clicks on the index). A
// distinct signal from the Approvals toolbar above.
export function isApprovalMode(): boolean {
  const raw = readRawMode();
  if (raw == null) return false;
  let mode: unknown = raw;
  try {
    mode = JSON.parse(raw);
  } catch {
    // value stored as a bare string
  }
  return mode === 'approve';
}
