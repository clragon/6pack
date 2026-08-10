import { ensureSheet } from '../../core/palette/sheet';
import STYLES from './styles.css?inline';

export function ensureStyles(): void {
  ensureSheet('sp-quick-replies-style', STYLES);
}

export { STYLES };
