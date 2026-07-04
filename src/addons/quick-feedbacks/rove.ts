import { deepActiveElement } from '../../core/palette/focus';

export function rove(
  container: HTMLElement | null,
  event: KeyboardEvent,
  selector: string,
): boolean {
  const current = deepActiveElement();
  if (!(current instanceof HTMLElement) || !current.matches(selector))
    return false;
  const items = Array.from(
    container?.querySelectorAll<HTMLElement>(selector) ?? [],
  );
  const index = items.indexOf(current);
  if (index < 0) return false;
  let target: HTMLElement | undefined;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
    target = items[index + 1];
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
    target = items[index - 1];
  else if (event.key === 'Home') target = items[0];
  else if (event.key === 'End') target = items[items.length - 1];
  else return false;
  event.preventDefault();
  if (target) {
    current.tabIndex = -1;
    target.tabIndex = 0;
    target.focus();
  }
  return true;
}
