import STYLES from './styles.css?inline';

const STYLE_ID = 'sp-quick-replies-style';

// The strip lives in page DOM and the dialog's slotted DText editor is light DOM
// too, so both need the sheet in document.head. The dialog chrome itself gets it
// through spawnDialog's shadow root.
export function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

// Injected into the page (for the strip) and into the palette's shadow root (for
// the dialog, via spawnDialog).
export { STYLES };
