import { ensureSheet } from '../../core/palette/sheet';
import STYLES from './styles.css?inline';

// The strip lives in page DOM and the dialog's slotted DText editor is light DOM
// too, so both need the sheet in document.head. The dialog chrome itself gets it
// through spawnDialog's shadow root.
export function ensureStyles(): void {
  ensureSheet('sp-quick-replies-style', STYLES);
}

export { STYLES };
