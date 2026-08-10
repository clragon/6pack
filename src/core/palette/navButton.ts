import { h, render } from 'preact';
import { Flame } from 'lucide-preact';

import { paletteStore } from './store';

// The controls ride the header at every width and hold the avatar. The tools
// ribbon holds Themes and Settings, and e621 folds it behind the hamburger on a
// phone, so one mount serves each width.
const CONTROLS = 'menu.nav-controls';
const TOOLS = 'menu.nav-tools';

// The boundary e621's stylesheet calls window-larger-than(50rem).
const DESKTOP = '(min-width: 50rem)';

const ACCENT = 'var(--palette-text-yellow, #ffd666)';

// e621 colours the tools ribbon's icons through its own sheet, which nests deep
// enough to outrank anything readable we could write, so the colour rides on the
// element instead of competing for it.
function paint(root: HTMLElement): void {
  root.style.color = ACCENT;
  const svg = root.querySelector('svg');
  if (svg instanceof SVGElement) svg.style.color = ACCENT;
}

function flameLink(): HTMLAnchorElement {
  const link = document.createElement('a');
  link.setAttribute('role', 'button');
  link.setAttribute('aria-label', 'Open 6pack');
  link.title = 'Open 6pack';
  link.style.cursor = 'pointer';
  link.addEventListener('click', (event) => {
    event.preventDefault();
    paletteStore.toggle();
  });
  return link;
}

// The controls are laid out row-reverse, so appending puts the button beside the
// avatar rather than at the far end. Its icon is wrapped, which is the shape
// `.nav-controls > a > span` sizes.
function mountControls(): () => void {
  const menu = document.querySelector<HTMLElement>(CONTROLS);
  if (!menu) return () => {};
  const link = flameLink();
  const icon = document.createElement('span');
  render(h(Flame, { size: 20, fill: 'currentColor' }), icon);
  link.appendChild(icon);
  menu.appendChild(link);
  paint(link);
  return () => {
    render(null, icon);
    link.remove();
  };
}

// The tools ribbon is a list, and it hides the label of every icon-only entry it
// carries, so this matches that shape and leaves the icon bare. It reads left to
// right, so the button leads the ribbon from the front.
function mountTools(): () => void {
  const menu = document.querySelector<HTMLElement>(TOOLS);
  if (!menu) return () => {};
  const item = document.createElement('li');
  const link = flameLink();
  render(h(Flame, { size: 20, fill: 'currentColor' }), link);
  item.appendChild(link);
  menu.prepend(item);
  paint(link);
  return () => {
    render(null, link);
    item.remove();
  };
}

// The trigger is a key combination, which a touch device cannot press, so the
// header carries the way into the palette at every width. Which menu holds it
// follows the viewport, so only the button that belongs is ever built.
export function mountNavButton(): () => void {
  const desktop = window.matchMedia(DESKTOP);
  let teardown: (() => void) | undefined;
  const sync = (): void => {
    teardown?.();
    teardown = desktop.matches ? mountTools() : mountControls();
  };
  sync();
  desktop.addEventListener('change', sync);
  return () => {
    desktop.removeEventListener('change', sync);
    teardown?.();
  };
}
