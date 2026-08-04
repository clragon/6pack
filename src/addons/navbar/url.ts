export function toPath(url: string): string {
  try {
    const parsed = new URL(url, location.origin);
    return parsed.origin === location.origin
      ? parsed.pathname + parsed.search + parsed.hash
      : url;
  } catch {
    return url;
  }
}
