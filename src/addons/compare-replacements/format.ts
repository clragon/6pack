const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function bytes(value: number): string {
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < UNITS.length - 1) {
    size /= 1024;
    unit++;
  }
  const rounded =
    size >= 100 || unit === 0 ? Math.round(size) : size.toFixed(1);
  return `${rounded} ${UNITS[unit]}`;
}

export function signedBytes(delta: number): string {
  const sign = delta >= 0 ? '+' : '-';
  return `${sign}${bytes(Math.abs(delta))}`;
}

export function pixels(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MP`;
  if (value >= 1000) return `${Math.round(value / 1000)} KP`;
  return String(value);
}

export function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
