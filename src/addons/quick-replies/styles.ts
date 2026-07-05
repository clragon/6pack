import STYLES from './styles.css?inline';

const STYLE_ID = 'sp-quick-replies-style';

export function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

export { STYLES };
