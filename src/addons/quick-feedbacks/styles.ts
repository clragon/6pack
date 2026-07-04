export const STYLES = `
.sp-qf-panel { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; max-width: 50rem; }
.sp-qf-output { margin-top: 6px; }
.sp-qf-strip { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.sp-qf-chip { padding: 4px 10px; font: inherit; font-size: 13px; color: inherit; background: none; border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; cursor: pointer; }
.sp-qf-chip:hover { background: var(--color-section-lighten-10, #2a3852); }
.sp-qf-strip-more { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; font: inherit; font-size: 13px; color: var(--color-text-muted, #9aa6bd); background: none; border: none; border-radius: 4px; cursor: pointer; }
.sp-qf-strip-more:hover { color: inherit; background: var(--color-section-lighten-10, #2a3852); }
.sp-qf-strip-flame { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; padding: 4px 8px; font: inherit; font-size: 13px; font-weight: 700; color: var(--palette-text-yellow, #ffd666); background: none; border: none; border-radius: 4px; cursor: pointer; }
.sp-qf-strip-flame:hover { background: var(--color-section-lighten-10, #2a3852); }
.sp-qf-label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--color-text-muted, #9aa6bd); margin-top: 4px; }
.sp-qf-input { width: 100%; box-sizing: border-box; padding: 8px 10px; font: inherit; font-size: 13px; color: inherit; background: var(--color-section-darken-5, rgba(0,0,0,0.2)); border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; }
.sp-qf-reason { resize: vertical; font-family: monospace; }
.sp-qf-grow { resize: none; overflow: hidden; }
.sp-qf-duration { width: 7rem; box-sizing: border-box; padding: 6px 9px; font: inherit; font-size: 13px; color: inherit; background: var(--color-section-darken-5, rgba(0,0,0,0.2)); border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; appearance: textfield; -moz-appearance: textfield; }
.sp-qf-duration:focus { outline: none; border-color: var(--color-link, #009be6); }
.sp-qf-duration::-webkit-inner-spin-button, .sp-qf-duration::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.sp-qf-switch-row { display: inline-flex; align-items: center; gap: 8px; padding: 4px 2px; background: none; border: none; color: inherit; font: inherit; font-size: 13px; cursor: pointer; }
.sp-qf-switch { position: relative; display: inline-block; flex: none; width: 34px; height: 18px; border-radius: 9px; background: var(--color-section-darken-5, rgba(0,0,0,0.3)); border: 1px solid var(--color-table-border, #313d52); transition: background-color .15s, border-color .15s; }
.sp-qf-switch::after { content: ''; position: absolute; top: 1px; left: 1px; width: 14px; height: 14px; border-radius: 50%; background: var(--color-text-muted, #9aa6bd); transition: transform .15s, background-color .15s; }
.sp-qf-switch-on { background: var(--palette-text-yellow, #ffd666); border-color: var(--palette-text-yellow, #ffd666); }
.sp-qf-switch-on::after { transform: translateX(16px); background: var(--color-section, #1b2433); }
.sp-qf-input:focus, .sp-qf-source:focus { outline: none; border-color: var(--color-link, #009be6); }
.sp-qf-sources-list { display: flex; flex-direction: column; gap: 4px; }
.sp-qf-source-row { position: relative; display: flex; align-items: center; }
.sp-qf-source { flex: 1; min-width: 0; box-sizing: border-box; padding: 8px 32px 8px 10px; font: inherit; font-size: 13px; color: inherit; background: var(--color-section-darken-5, rgba(0,0,0,0.2)); border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; }
.sp-qf-source-x { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; font: inherit; font-size: 16px; line-height: 1; color: var(--color-text-muted, #9aa6bd); background: none; border: none; border-radius: 50%; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .15s, color .15s, background-color .15s; }
.sp-qf-source-row:hover .sp-qf-source:not(:placeholder-shown) ~ .sp-qf-source-x, .sp-qf-source:focus:not(:placeholder-shown) ~ .sp-qf-source-x { opacity: 1; pointer-events: auto; }
.sp-qf-source-x:hover { color: inherit; }
@media (prefers-reduced-motion: reduce) { .sp-qf-source-x { transition: none; } }
.sp-qf-rules { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.sp-qf-pill { padding: 3px 9px; font: inherit; font-size: 12px; color: inherit; background: none; border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; cursor: pointer; }
.sp-qf-pill:hover { background: var(--color-section-lighten-5, #28323f); }
.sp-qf-on { border-color: var(--palette-text-yellow, #ffd666); color: var(--palette-text-yellow, #ffd666); }
.sp-qf-cat-none.sp-qf-on { border-color: var(--color-text-muted, #9aa6bd); color: inherit; }
.sp-qf-cat-positive.sp-qf-on { border-color: #5ab562; color: #5ab562; }
.sp-qf-cat-neutral.sp-qf-on { border-color: #93a0ba; color: #93a0ba; }
.sp-qf-cat-negative.sp-qf-on { border-color: #e0645f; color: #e0645f; }
.sp-qf-cat-ban.sp-qf-on { border-color: #c8433d; color: #c8433d; }
.sp-qf-more { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; font: inherit; font-size: 12px; color: var(--color-text-muted, #9aa6bd); background: none; border: none; border-radius: 4px; cursor: pointer; }
.sp-qf-more:hover { color: inherit; background: var(--color-section-lighten-5, #28323f); }

.sp-qf-manager { display: flex; min-height: 0; flex: 1; }
.sp-qf-list { width: 210px; flex: none; border-right: 1px solid var(--color-table-border, #313d52); padding: 8px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.sp-qf-list-item { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 7px 9px; text-align: left; border: none; background: none; color: inherit; border-radius: 4px; cursor: pointer; font: inherit; font-size: 13px; }
.sp-qf-list-item:hover { background: var(--color-section-lighten-5, #28323f); }
.sp-qf-selected { background: var(--color-section-lighten-10, #2a3852); }
.sp-qf-drop-over { box-shadow: inset 0 2px 0 var(--palette-text-yellow, #ffd666); }
.sp-qf-list-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp-qf-pin-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--palette-text-yellow, #ffd666); flex: none; }
.sp-qf-add { display: flex; align-items: center; gap: 6px; padding: 7px 9px; border: 1px dashed var(--color-table-border, #313d52); background: none; color: inherit; border-radius: 4px; cursor: pointer; font: inherit; font-size: 13px; margin-top: 4px; }
.sp-qf-add:hover { background: var(--color-section-lighten-5, #28323f); }
.sp-qf-editor { flex: 1; min-width: 0; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
.sp-qf-editor > * { flex: none; }
.sp-qf-reason-slot { min-height: 212px; }
.sp-qf-empty { color: var(--color-text-muted, #9aa6bd); font-size: 13px; margin: auto; }
.sp-qf-rule-groups { display: flex; flex-direction: column; gap: 10px; }
.sp-qf-rule-group-label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--color-text-muted, #9aa6bd); margin-bottom: 5px; }
.sp-qf-title-row { display: flex; align-items: center; gap: 6px; min-height: 40px; }
.sp-qf-title-row .sp-qf-input { flex: 1; width: auto; min-width: 0; }
.sp-qf-icon-btn { display: inline-flex; align-items: center; justify-content: center; padding: 5px; min-width: 28px; background: none; border: none; color: inherit; border-radius: 4px; cursor: pointer; }
.sp-qf-icon-btn:hover { background: var(--color-section-lighten-10, #2a3852); }
.sp-qf-icon-btn.sp-qf-pinned { color: var(--palette-text-yellow, #ffd666); }
.sp-qf-danger:hover { color: #ff6b6b; }
.sp-qf-confirm { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 4px 10px; border: 1px solid #ff6b6b; border-radius: 4px; }
.sp-qf-confirm span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp-qf-confirm-yes { padding: 4px 12px; font: inherit; font-size: 13px; color: #fff; background: #d64545; border: 1px solid #d64545; border-radius: 4px; cursor: pointer; }
.sp-qf-confirm-yes:hover { background: #ff6b6b; }
.sp-qf-confirm-no { padding: 4px 12px; font: inherit; font-size: 13px; color: inherit; background: none; border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; cursor: pointer; }
.sp-qf-confirm-no:hover { background: var(--color-section-lighten-10, #2a3852); }
.sp-qf-list-actions { margin-top: auto; display: flex; flex-direction: column; gap: 6px; padding-top: 6px; }
.sp-qf-add-row { display: flex; gap: 6px; align-items: stretch; }
.sp-qf-add-row .sp-qf-add { flex: 1; margin-top: 0; }
.sp-qf-more-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; border: 1px dashed var(--color-table-border, #313d52); border-radius: 4px; color: var(--color-text-muted, #9aa6bd); background: none; cursor: pointer; }
.sp-qf-more-btn:hover { color: inherit; background: var(--color-section-lighten-5, #28323f); }
.sp-qf-tool-menu { display: flex; gap: 6px; }
.sp-qf-tool-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; flex: 1; padding: 6px 8px; font: inherit; font-size: 12px; color: var(--color-text-muted, #9aa6bd); background: none; border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; cursor: pointer; }
.sp-qf-tool-btn:hover { color: inherit; background: var(--color-section-lighten-5, #28323f); }
.sp-qf-list-item:focus-visible, .sp-qf-add:focus-visible, .sp-qf-more-btn:focus-visible, .sp-qf-tool-btn:focus-visible, .sp-qf-pill:focus-visible, .sp-qf-chip:focus-visible, .sp-qf-source-x:focus-visible, .sp-qf-switch-row:focus-visible { outline: 2px solid var(--palette-text-yellow, #ffd666); outline-offset: -2px; }
@media (max-width: 640px) {
  .sp-qf-manager { flex-direction: column; }
  .sp-qf-list { width: auto; flex: 1 1 auto; border-right: none; border-bottom: 1px solid var(--color-table-border, #313d52); }
  .sp-qf-manager.sp-qf-view-detail .sp-qf-list { display: none; }
  .sp-qf-manager.sp-qf-view-list .sp-qf-editor { display: none; }
}
`;
