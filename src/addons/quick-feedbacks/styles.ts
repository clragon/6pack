export const STYLES = `
.qf-panel { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; max-width: 50rem; }
.qf-output { margin-top: 6px; }
.qf-strip { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.qf-chip { padding: 4px 10px; font: inherit; font-size: 13px; color: inherit; background: none; border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; cursor: pointer; }
.qf-chip:hover { background: var(--color-section-lighten-10, #2a3852); }
.qf-strip-more { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; font: inherit; font-size: 13px; color: var(--color-text-muted, #9aa6bd); background: none; border: none; border-radius: 4px; cursor: pointer; }
.qf-strip-more:hover { color: inherit; background: var(--color-section-lighten-10, #2a3852); }
.qf-strip-flame { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; padding: 4px 8px; font: inherit; font-size: 13px; font-weight: 700; color: var(--palette-text-yellow, #ffd666); background: none; border: none; border-radius: 4px; cursor: pointer; }
.qf-strip-flame:hover { background: var(--color-section-lighten-10, #2a3852); }
.qf-label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--color-text-muted, #9aa6bd); margin-top: 4px; }
.qf-input { width: 100%; box-sizing: border-box; padding: 8px 10px; font: inherit; font-size: 13px; color: inherit; background: var(--color-section-darken-5, rgba(0,0,0,0.2)); border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; }
.qf-reason { resize: vertical; font-family: monospace; }
.qf-grow { resize: none; overflow: hidden; }
.qf-duration { width: 7rem; box-sizing: border-box; padding: 6px 9px; font: inherit; font-size: 13px; color: inherit; background: var(--color-section-darken-5, rgba(0,0,0,0.2)); border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; appearance: textfield; -moz-appearance: textfield; }
.qf-duration:focus { outline: none; border-color: var(--color-link, #009be6); }
.qf-duration::-webkit-inner-spin-button, .qf-duration::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.qf-switch-row { display: inline-flex; align-items: center; gap: 8px; padding: 4px 2px; background: none; border: none; color: inherit; font: inherit; font-size: 13px; cursor: pointer; }
.qf-switch { position: relative; display: inline-block; flex: none; width: 34px; height: 18px; border-radius: 9px; background: var(--color-section-darken-5, rgba(0,0,0,0.3)); border: 1px solid var(--color-table-border, #313d52); transition: background-color .15s, border-color .15s; }
.qf-switch::after { content: ''; position: absolute; top: 1px; left: 1px; width: 14px; height: 14px; border-radius: 50%; background: var(--color-text-muted, #9aa6bd); transition: transform .15s, background-color .15s; }
.qf-switch-on { background: var(--palette-text-yellow, #ffd666); border-color: var(--palette-text-yellow, #ffd666); }
.qf-switch-on::after { transform: translateX(16px); background: var(--color-section, #1b2433); }
.qf-input:focus, .qf-source:focus { outline: none; border-color: var(--color-link, #009be6); }
.qf-sources-list { display: flex; flex-direction: column; gap: 4px; }
.qf-source-row { position: relative; display: flex; align-items: center; }
.qf-source { flex: 1; min-width: 0; box-sizing: border-box; padding: 8px 32px 8px 10px; font: inherit; font-size: 13px; color: inherit; background: var(--color-section-darken-5, rgba(0,0,0,0.2)); border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; }
.qf-source-x { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; font: inherit; font-size: 16px; line-height: 1; color: var(--color-text-muted, #9aa6bd); background: none; border: none; border-radius: 50%; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .15s, color .15s, background-color .15s; }
.qf-source-row:hover .qf-source:not(:placeholder-shown) ~ .qf-source-x, .qf-source:focus:not(:placeholder-shown) ~ .qf-source-x { opacity: 1; pointer-events: auto; }
.qf-source-x:hover { color: inherit; }
@media (prefers-reduced-motion: reduce) { .qf-source-x { transition: none; } }
.qf-rules { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.qf-pill { padding: 3px 9px; font: inherit; font-size: 12px; color: inherit; background: none; border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; cursor: pointer; }
.qf-pill:hover { background: var(--color-section-lighten-5, #28323f); }
.qf-on { border-color: var(--palette-text-yellow, #ffd666); color: var(--palette-text-yellow, #ffd666); }
.qf-cat-none.qf-on { border-color: var(--color-text-muted, #9aa6bd); color: inherit; }
.qf-cat-positive.qf-on { border-color: #5ab562; color: #5ab562; }
.qf-cat-neutral.qf-on { border-color: #93a0ba; color: #93a0ba; }
.qf-cat-negative.qf-on { border-color: #e0645f; color: #e0645f; }
.qf-cat-ban.qf-on { border-color: #c8433d; color: #c8433d; }
.qf-more { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; font: inherit; font-size: 12px; color: var(--color-text-muted, #9aa6bd); background: none; border: none; border-radius: 4px; cursor: pointer; }
.qf-more:hover { color: inherit; background: var(--color-section-lighten-5, #28323f); }

.qf-manager { display: flex; min-height: 0; flex: 1; }
.qf-list { width: 210px; flex: none; border-right: 1px solid var(--color-table-border, #313d52); padding: 8px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.qf-list-item { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 7px 9px; text-align: left; border: none; background: none; color: inherit; border-radius: 4px; cursor: pointer; font: inherit; font-size: 13px; }
.qf-list-item:hover { background: var(--color-section-lighten-5, #28323f); }
.qf-selected { background: var(--color-section-lighten-10, #2a3852); }
.qf-drop-over { box-shadow: inset 0 2px 0 var(--palette-text-yellow, #ffd666); }
.qf-list-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qf-pin-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--palette-text-yellow, #ffd666); flex: none; }
.qf-add { display: flex; align-items: center; gap: 6px; padding: 7px 9px; border: 1px dashed var(--color-table-border, #313d52); background: none; color: inherit; border-radius: 4px; cursor: pointer; font: inherit; font-size: 13px; margin-top: 4px; }
.qf-add:hover { background: var(--color-section-lighten-5, #28323f); }
.qf-editor { flex: 1; min-width: 0; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
.qf-editor > * { flex: none; }
.qf-empty { color: var(--color-text-muted, #9aa6bd); font-size: 13px; margin: auto; }
.qf-rule-groups { display: flex; flex-direction: column; gap: 10px; }
.qf-rule-group-label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--color-text-muted, #9aa6bd); margin-bottom: 5px; }
.qf-title-row { display: flex; align-items: center; gap: 6px; min-height: 40px; }
.qf-title-row .qf-input { flex: 1; width: auto; min-width: 0; }
.qf-icon-btn { display: inline-flex; align-items: center; justify-content: center; padding: 5px; min-width: 28px; background: none; border: none; color: inherit; border-radius: 4px; cursor: pointer; }
.qf-icon-btn:hover { background: var(--color-section-lighten-10, #2a3852); }
.qf-icon-btn.qf-pinned { color: var(--palette-text-yellow, #ffd666); }
.qf-danger:hover { color: #ff6b6b; }
.qf-confirm { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 4px 10px; border: 1px solid #ff6b6b; border-radius: 4px; }
.qf-confirm span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qf-confirm-yes { padding: 4px 12px; font: inherit; font-size: 13px; color: #fff; background: #d64545; border: 1px solid #d64545; border-radius: 4px; cursor: pointer; }
.qf-confirm-yes:hover { background: #ff6b6b; }
.qf-confirm-no { padding: 4px 12px; font: inherit; font-size: 13px; color: inherit; background: none; border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; cursor: pointer; }
.qf-confirm-no:hover { background: var(--color-section-lighten-10, #2a3852); }
.qf-list-actions { margin-top: auto; display: flex; flex-direction: column; gap: 6px; padding-top: 6px; }
.qf-add-row { display: flex; gap: 6px; align-items: stretch; }
.qf-add-row .qf-add { flex: 1; margin-top: 0; }
.qf-more-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; border: 1px dashed var(--color-table-border, #313d52); border-radius: 4px; color: var(--color-text-muted, #9aa6bd); background: none; cursor: pointer; }
.qf-more-btn:hover { color: inherit; background: var(--color-section-lighten-5, #28323f); }
.qf-tool-menu { display: flex; gap: 6px; }
.qf-tool-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; flex: 1; padding: 6px 8px; font: inherit; font-size: 12px; color: var(--color-text-muted, #9aa6bd); background: none; border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; cursor: pointer; }
.qf-tool-btn:hover { color: inherit; background: var(--color-section-lighten-5, #28323f); }
.qf-list-item:focus-visible, .qf-add:focus-visible, .qf-more-btn:focus-visible, .qf-tool-btn:focus-visible, .qf-pill:focus-visible, .qf-chip:focus-visible, .qf-source-x:focus-visible, .qf-switch-row:focus-visible { outline: 2px solid var(--palette-text-yellow, #ffd666); outline-offset: -2px; }
@media (max-width: 640px) {
  .qf-manager { flex-direction: column; }
  .qf-list { width: auto; flex: 1 1 auto; border-right: none; border-bottom: 1px solid var(--color-table-border, #313d52); }
  .qf-manager.qf-view-detail .qf-list { display: none; }
  .qf-manager.qf-view-list .qf-editor { display: none; }
}
`;
