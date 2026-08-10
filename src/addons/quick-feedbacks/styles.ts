import { ensureSheet } from '../../core/palette/sheet';
import STYLES from './styles.css?inline';

// The dialog's slotted DText editor is light DOM, so it needs the sheet in
// document.head. The embed's own shadow root and the dialog chrome each get it
// through spawnDialog instead.
export function ensureStyles(): void {
  ensureSheet('sp-quick-feedbacks-style', STYLES);
}

export { STYLES };
