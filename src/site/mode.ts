// The post-list mass-action mode menu (#mode-box-mode), present on the posts
// index / favorites / pools. We read its real options so the set adapts to the
// user's permissions, and flip it via a native change event so e621's own
// PostModeMenu.change() does the activation.

export interface ModeOption {
  value: string;
  label: string;
}

export function readModes(): ModeOption[] {
  const select = document.querySelector<HTMLSelectElement>('#mode-box-mode');
  if (!select) return [];
  return Array.from(select.options).map((option) => ({
    value: option.value,
    label: option.textContent?.trim() || option.value,
  }));
}

export function setMode(value: string): void {
  const select = document.querySelector<HTMLSelectElement>('#mode-box-mode');
  if (!select) return;
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}
