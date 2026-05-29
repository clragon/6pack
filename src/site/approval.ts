export function isApprovalsEnabled(): boolean {
  try {
    return localStorage.getItem('jtb') === 'true';
  } catch {
    return false;
  }
}

export function readRawMode(): string | null {
  try {
    return localStorage.getItem('mode');
  } catch {
    return null;
  }
}

export function isApprovalMode(): boolean {
  const raw = readRawMode();
  if (raw == null) return false;
  let mode: unknown = raw;
  try {
    mode = JSON.parse(raw);
  } catch {
    // e621 stores the mode as a bare string, so the raw value stands.
  }
  return mode === 'approve';
}
