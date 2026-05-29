export const PALETTE_CSS = `
.sp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  font-family: Verdana, Helvetica, Arial, sans-serif;
}
.sp-backdrop * {
  box-sizing: border-box;
}
.sp-panel {
  margin-top: 12vh;
  width: min(560px, 92vw);
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-section, #1b2433);
  background-image: var(--image-foreground, none);
  background-repeat: var(--image-foreground-repeat, no-repeat);
  background-position: var(--image-foreground-position, left top);
  color: var(--color-text, #e6e9ef);
  border: 1px solid var(--color-table-border, #313d52);
  border-radius: 6px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
.sp-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  background: var(--color-section-darken-5, transparent);
  border-bottom: 1px solid var(--color-table-border, #313d52);
}
.sp-crumbs {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}
.sp-home {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0 2px;
  color: #e8743b;
  cursor: pointer;
}
.sp-home:hover {
  color: #ff8c4a;
}
.sp-crumb-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.sp-crumb-arrow {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--color-text-muted, #9aa6bd);
}
.sp-crumb {
  background: none;
  border: none;
  font: inherit;
  font-size: 13px;
  padding: 0;
  color: var(--color-text-muted, #9aa6bd);
  white-space: nowrap;
  cursor: pointer;
}
button.sp-crumb:hover {
  color: var(--color-text, #e6e9ef);
}
.sp-crumb-current {
  cursor: default;
}
.sp-go {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--color-text-muted, #9aa6bd);
  font: inherit;
  font-size: 18px;
  line-height: 1;
  padding: 0 4px;
  cursor: pointer;
}
.sp-go:hover {
  color: var(--color-text, #e6e9ef);
}
.sp-item.sp-suggestion {
  flex-direction: row;
  align-items: baseline;
  gap: 6px;
}
.sp-item.sp-suggestion .sp-desc {
  margin-left: auto;
  padding-left: 12px;
}
.sp-input {
  flex: 1;
  padding: 12px 0;
  font: inherit;
  font-size: 15px;
  color: inherit;
  background: transparent;
  border: none;
  outline: none;
}
.sp-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
}
.sp-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text, #e6e9ef);
}
.sp-selected {
  background: var(--color-section-lighten-10, #2a3852);
}
.sp-title {
  font-size: 14px;
}
.sp-group-arrow {
  color: var(--color-text-muted, #9aa6bd);
}
.sp-desc {
  font-size: 12px;
  color: var(--color-text-muted, #9aa6bd);
}
.sp-empty {
  padding: 16px;
  text-align: center;
  color: var(--color-text-muted, #9aa6bd);
  font-size: 13px;
}
.sp-capture {
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 8px;
}
.sp-capture-title {
  font-size: 15px;
}
.sp-capture-hint {
  font-size: 12px;
  color: var(--color-text-muted, #9aa6bd);
}
.sp-confirm {
  display: flex;
  flex-direction: column;
  padding: 18px;
  gap: 12px;
}
.sp-confirm-title {
  font-size: 15px;
  font-weight: bold;
}
.sp-confirm-detail {
  font-size: 13px;
  color: var(--color-text-muted, #9aa6bd);
  white-space: pre-wrap;
}
.sp-confirm-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
.sp-confirm-input {
  padding: 8px 10px;
  font: inherit;
  font-size: 14px;
  color: inherit;
  background: var(--color-section-darken-5, rgba(0, 0, 0, 0.2));
  border: 1px solid var(--color-table-border, #313d52);
  border-radius: 4px;
  outline: none;
}
.sp-confirm-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
}
.sp-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
.sp-btn {
  padding: 6px 14px;
  font: inherit;
  font-size: 13px;
  color: inherit;
  background: var(--color-section-lighten-10, #2a3852);
  border: 1px solid var(--color-table-border, #313d52);
  border-radius: 4px;
  cursor: pointer;
}
.sp-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.sp-btn-danger {
  background: #7a2227;
  border-color: #b3343a;
  color: #fff;
}
.sp-banner {
  padding: 12px 14px;
  background: #8a1a1f;
  border-bottom: 2px solid #e0454c;
  color: #fff;
}
.sp-banner-title {
  font-size: 14px;
  font-weight: bold;
}
.sp-banner-detail {
  margin-top: 3px;
  font-size: 12px;
  color: #ffd9db;
}
`;
