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
  // e621's post_mode_menu.js listens for change on #mode-box-mode and runs
  // PostModeMenu.change to activate the mode.
  select.dispatchEvent(new Event('change', { bubbles: true }));
}
