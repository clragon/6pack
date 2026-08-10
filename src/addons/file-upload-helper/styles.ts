import { ensureSheet } from '../../core/palette/sheet';
import STYLES from './styles.css?inline';

const SHEET_ID = 'sp-file-upload-helper-style';

export function ensureStyles(): void {
  ensureSheet(SHEET_ID, STYLES);
}
