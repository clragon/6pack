import { h, render } from 'preact';
import { Flame } from 'lucide-preact';

import { paletteStore } from './store';

// e621 shows menu.nav-controls at every width and hides menu.nav-tools on a
// phone until the hamburger opens it.
const CONTROLS = 'menu.nav-controls';
const TOOLS = 'menu.nav-tools';

// The breakpoint e621's navigation.scss wraps in its window-larger-than mixin
// at 50rem, where the nav switches to its desktop grid.
const DESKTOP = '(min-width: 50rem)';

const ACCENT = 'var(--palette-text-yellow, #ffd666)';

// e621's navigation.scss colours .nav-tools li a svg under a media query,
// which outranks a class rule, so the colour rides inline.
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

function mountControls(): () => void {
  const menu = document.querySelector<HTMLElement>(CONTROLS);
  if (!menu) return () => {};
  const link = flameLink();
  // e621 lays .nav-controls out row-reverse, so appending lands beside the
  // avatar, and its .nav-controls > a > span rule sizes the wrapped icon.
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
