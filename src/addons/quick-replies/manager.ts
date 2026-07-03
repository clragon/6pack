import { h, render } from 'preact';
import {
  Download,
  MoreHorizontal,
  Pin,
  Plus,
  Trash2,
  Upload,
  type LucideIcon,
} from 'lucide-preact';
import { unsafeWindow } from 'vite-plugin-monkey/dist/client';

import { spawnDialog } from '../../core/palette/spawnDialog';
import type { DialogCrumb } from '../../core/palette/dialog';
import { deepActiveElement } from '../../core/palette/focus';
import {
  addTemplate,
  listTemplates,
  moveTemplate,
  removeTemplate,
  setTemplates,
  type Template,
  updateTemplate,
} from './store';
import { VARIABLES } from './variables';

function iconSpan(icon: LucideIcon, fill = 'none'): HTMLSpanElement {
  const span = document.createElement('span');
  span.style.display = 'inline-flex';
  render(h(icon, { size: 16, fill }), span);
  return span;
}

const STYLE_ID = 'quick-replies-style';

export function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.appendChild(style);
}

function iconButton(
  icon: LucideIcon,
  title: string,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'qr-icon-btn';
  button.title = title;
  button.appendChild(iconSpan(icon));
  button.addEventListener('click', onClick);
  return button;
}

function toolButton(
  icon: LucideIcon,
  label: string,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'qr-tool-btn';
  button.appendChild(iconSpan(icon));
  const span = document.createElement('span');
  span.textContent = label;
  button.appendChild(span);
  button.addEventListener('click', onClick);
  return button;
}

function insertToken(area: HTMLTextAreaElement, token: string): void {
  const { selectionStart: start, selectionEnd: end } = area;
  area.value = area.value.slice(0, start) + token + area.value.slice(end);
  area.selectionStart = area.selectionEnd = start + token.length;
  area.focus();
}

interface Editor {
  node: HTMLElement;
  textarea: HTMLTextAreaElement;
  formatter?: { destroy?: () => void };
}

function buildEditor(body: string, onInput: (value: string) => void): Editor {
  const node = document.createElement('div');
  node.className = 'qr-editor';
  const textarea = document.createElement('textarea');
  textarea.rows = 9;
  textarea.value = body;
  textarea.placeholder = 'Body. Click a variable below to insert it.';
  textarea.classList.add('dtext-vue');
  textarea.setAttribute('data-color', 'false');
  node.appendChild(textarea);
  textarea.addEventListener('input', () => onInput(textarea.value));

  let formatter: { destroy?: () => void } | undefined;
  const page = unsafeWindow as unknown as {
    Danbooru?: { DTextFormatter?: { buildFromTextarea: (t: unknown) => unknown } };
    jQuery?: (el: unknown) => unknown;
  };
  const dtext = page.Danbooru?.DTextFormatter;
  if (dtext && page.jQuery) {
    try {
      formatter = dtext.buildFromTextarea(page.jQuery(textarea)) as {
        destroy?: () => void;
      };
      for (const el of node.querySelectorAll<HTMLElement>(
        'button, a[href], [tabindex]',
      )) {
        if (el !== textarea) el.tabIndex = -1;
      }
    } catch {}
  }
  return { node, textarea, formatter };
}

export function openTemplatesManager(initialBody?: string): void {
  ensureStyles();
  spawnDialog({
    trail: [{ title: 'Manage quick replies' }],
    styles: STYLES,
    render: (host, _close, setTrail) =>
      buildManager(host, initialBody, setTrail),
  });
}

function wireRove(container: HTMLElement, itemClass: string): void {
  container.addEventListener('keydown', (event) => {
    const active = deepActiveElement();
    if (!(active instanceof HTMLElement) || !active.classList.contains(itemClass))
      return;
    const items = Array.from(
      container.querySelectorAll<HTMLElement>('.' + itemClass),
    );
    const index = items.indexOf(active);
    let target: HTMLElement | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      target = items[index + 1];
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      target = items[index - 1];
    else if (event.key === 'Home') target = items[0];
    else if (event.key === 'End') target = items[items.length - 1];
    else return;
    event.preventDefault();
    if (!target) return;
    active.tabIndex = -1;
    target.tabIndex = 0;
    target.focus();
  });
}

function buildManager(
  host: HTMLElement,
  initialBody?: string,
  setTrail?: (trail: DialogCrumb[]) => void,
): () => void {
  let selectedId: string | undefined =
    initialBody !== undefined
      ? addTemplate('', initialBody).id
      : listTemplates()[0]?.id;
  let pendingDelete = false;

  const narrow = window.matchMedia('(max-width: 640px)');
  let view: 'list' | 'detail' = initialBody !== undefined ? 'detail' : 'list';

  const rootNode = host.getRootNode();
  const shadowHost =
    rootNode instanceof ShadowRoot ? (rootNode.host as HTMLElement) : null;

  let editor: Editor | undefined;
  function teardownEditor(): void {
    try {
      editor?.formatter?.destroy?.();
    } catch {}
    editor?.node.remove();
    editor = undefined;
  }

  const listCol = document.createElement('div');
  listCol.className = 'qr-list';

  const MEMBER = '.qr-list-item, .qr-add, .qr-more-btn';
  function members(): HTMLElement[] {
    return Array.from(listCol.querySelectorAll<HTMLElement>(MEMBER));
  }
  function focusMember(item: HTMLElement | null | undefined): void {
    if (!item) return;
    for (const el of members()) el.tabIndex = el === item ? 0 : -1;
    item.focus();
  }
  listCol.addEventListener('keydown', (event) => {
    const active = deepActiveElement();
    if (!(active instanceof HTMLElement) || !active.matches(MEMBER)) return;
    const items = members();
    const index = items.indexOf(active);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      if (event.altKey && active.classList.contains('qr-list-item')) {
        const id = active.dataset.id;
        if (!id) return;
        moveTemplate(id, delta);
        renderList();
      } else {
        focusMember(items[index + delta]);
      }
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusMember(items[0]);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusMember(items[items.length - 1]);
    }
  });
  const formCol = document.createElement('div');
  formCol.className = 'qr-form';
  const body = document.createElement('div');
  body.className = 'qr-body';
  body.append(listCol, formCol);

  host.append(body);

  function select(id: string | undefined): void {
    selectedId = id;
    pendingDelete = false;
    renderList();
    renderForm();
  }

  function doDelete(templateId: string): void {
    removeTemplate(templateId);
    select(listTemplates()[0]?.id);
    if (narrow.matches) showList();
  }

  function applyView(): void {
    body.classList.toggle('qr-view-detail', view === 'detail');
    body.classList.toggle('qr-view-list', view === 'list');
    if (!setTrail) return;
    if (narrow.matches && view === 'detail') {
      const title = listTemplates().find((t) => t.id === selectedId)?.title;
      setTrail([
        { title: 'Manage quick replies', onClick: showList },
        { title: title || '(untitled)' },
      ]);
    } else {
      setTrail([{ title: 'Manage quick replies' }]);
    }
  }

  function showList(): void {
    view = 'list';
    applyView();
    listCol
      .querySelector<HTMLElement>('.qr-selected, .qr-list-item')
      ?.focus({ preventScroll: true });
  }

  function showDetail(): void {
    view = 'detail';
    applyView();
    formCol
      .querySelector<HTMLInputElement>('.qr-title-input')
      ?.focus({ preventScroll: true });
  }

  function renderList(): void {
    const focused = deepActiveElement();
    const active =
      focused instanceof HTMLElement && listCol.contains(focused)
        ? focused
        : null;
    const restore = active
      ? active.dataset.id
        ? `.qr-list-item[data-id="${active.dataset.id}"]`
        : active.classList.contains('qr-add')
          ? '.qr-add'
          : active.classList.contains('qr-more-btn')
            ? '.qr-more-btn'
            : undefined
      : undefined;
    listCol.replaceChildren();
    const templates = listTemplates();
    const rovingId = templates.some((t) => t.id === selectedId)
      ? selectedId
      : templates[0]?.id;
    for (const template of templates) {
      const item = document.createElement('button');
      item.type = 'button';
      item.dataset.id = template.id;
      item.tabIndex = template.id === rovingId ? 0 : -1;
      item.className =
        'qr-list-item' + (template.id === selectedId ? ' qr-selected' : '');
      const name = document.createElement('span');
      name.className = 'qr-list-name';
      name.textContent = template.title || '(untitled)';
      item.appendChild(name);
      if (template.pinned) {
        const dot = document.createElement('span');
        dot.className = 'qr-pin-dot';
        dot.title = 'Shown on the response strip';
        item.appendChild(dot);
      }
      item.addEventListener('click', () => {
        select(template.id);
        if (narrow.matches) showDetail();
      });
      listCol.appendChild(item);
    }
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'qr-add';
    add.tabIndex = templates.length ? -1 : 0;
    add.appendChild(iconSpan(Plus));
    const label = document.createElement('span');
    label.textContent = 'New reply';
    add.appendChild(label);
    add.addEventListener('click', () => {
      select(addTemplate('', '').id);
      if (narrow.matches) showDetail();
      else formCol.querySelector<HTMLInputElement>('.qr-title-input')?.focus();
    });

    const menu = document.createElement('div');
    menu.className = 'qr-tool-menu';
    menu.hidden = true;
    menu.append(
      toolButton(Download, 'Export', exportToFile),
      toolButton(Upload, 'Import', () => importFromFile(() => select(selectedId))),
    );
    menu
      .querySelectorAll<HTMLElement>('.qr-tool-btn')
      .forEach((btn, i) => (btn.tabIndex = i === 0 ? 0 : -1));
    wireRove(menu, 'qr-tool-btn');
    const more = iconButton(MoreHorizontal, 'Import or export', () => {
      menu.hidden = !menu.hidden;
      if (!menu.hidden) menu.querySelector<HTMLElement>('.qr-tool-btn')?.focus();
    });
    more.classList.add('qr-more-btn');
    more.tabIndex = -1;

    const addRow = document.createElement('div');
    addRow.className = 'qr-add-row';
    addRow.append(add, more);

    const actions = document.createElement('div');
    actions.className = 'qr-list-actions';
    actions.append(addRow, menu);
    listCol.appendChild(actions);

    if (restore) focusMember(listCol.querySelector<HTMLElement>(restore));
  }

  function renderForm(): void {
    teardownEditor();
    formCol.replaceChildren();
    const template = listTemplates().find((t) => t.id === selectedId);
    if (!template) {
      const empty = document.createElement('div');
      empty.className = 'qr-empty';
      empty.textContent = 'Select a reply, or add a new one.';
      formCol.appendChild(empty);
      return;
    }
    const id = template.id;

    const title = document.createElement('input');
    title.type = 'text';
    title.className = 'qr-title-input';
    title.placeholder = 'Title';
    title.value = template.title;
    title.addEventListener('input', () => {
      updateTemplate(id, { title: title.value });
      renderList();
    });

    const built = buildEditor(template.body, (value) =>
      updateTemplate(id, { body: value }),
    );
    editor = built;
    const bodyTextarea = built.textarea;

    const chips = document.createElement('div');
    chips.className = 'qr-chips';
    const chipsLabel = document.createElement('span');
    chipsLabel.className = 'qr-chips-label';
    chipsLabel.textContent = 'Insert:';
    chips.appendChild(chipsLabel);
    for (const [i, variable] of VARIABLES.entries()) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'qr-chip';
      chip.tabIndex = i === 0 ? 0 : -1;
      chip.textContent = variable.label;
      chip.title = `Inserts %${variable.token}%`;
      chip.addEventListener('click', () => {
        insertToken(bodyTextarea, `%${variable.token}%`);
        bodyTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
      chips.appendChild(chip);
    }
    wireRove(chips, 'qr-chip');

    const pinBtn = document.createElement('button');
    pinBtn.type = 'button';
    pinBtn.className = 'qr-icon-btn';
    const pinIcon = iconSpan(Pin);
    pinBtn.appendChild(pinIcon);
    const paintPin = () => {
      const pinned = !!listTemplates().find((t) => t.id === id)?.pinned;
      render(
        h(Pin, { size: 16, fill: pinned ? 'currentColor' : 'none' }),
        pinIcon,
      );
      pinBtn.classList.toggle('qr-pinned', pinned);
      pinBtn.title = pinned ? 'Shown on the strip' : 'Show on the strip';
    };
    pinBtn.addEventListener('click', () => {
      const pinned = !!listTemplates().find((t) => t.id === id)?.pinned;
      updateTemplate(id, { pinned: !pinned });
      paintPin();
      renderList();
    });
    paintPin();

    const del = iconButton(Trash2, 'Delete reply', () => {
      const live = listTemplates().find((t) => t.id === id);
      if (live && !live.title.trim() && !live.body.trim()) {
        doDelete(id);
        return;
      }
      pendingDelete = true;
      renderForm();
    });
    del.classList.add('qr-danger');

    const titleRow = document.createElement('div');
    titleRow.className = 'qr-title-row';
    titleRow.append(title, pinBtn, del);

    if (pendingDelete) {
      const confirm = deletePrompt(template);
      formCol.append(confirm);
      requestAnimationFrame(() =>
        confirm.querySelector<HTMLElement>('.qr-confirm-no')?.focus(),
      );
    } else {
      formCol.append(titleRow);
    }
    if (shadowHost) {
      built.node.slot = 'qr-editor';
      shadowHost.appendChild(built.node);
      const slot = document.createElement('slot');
      slot.setAttribute('name', 'qr-editor');
      formCol.append(slot, chips);
    } else {
      formCol.append(built.node, chips);
    }
  }

  function deletePrompt(template: Template): HTMLElement {
    const row = document.createElement('div');
    row.className = 'qr-confirm';
    const text = document.createElement('span');
    text.textContent = `Delete "${template.title || '(untitled)'}"?`;
    const yes = document.createElement('button');
    yes.type = 'button';
    yes.className = 'qr-confirm-yes';
    yes.textContent = 'Delete';
    yes.addEventListener('click', () => doDelete(template.id));
    const no = document.createElement('button');
    no.type = 'button';
    no.className = 'qr-confirm-no';
    no.textContent = 'Cancel';
    no.addEventListener('click', () => {
      pendingDelete = false;
      renderForm();
      formCol.querySelector<HTMLElement>('.qr-danger')?.focus();
    });
    row.append(text, yes, no);
    return row;
  }

  renderList();
  renderForm();
  applyView();
  narrow.addEventListener('change', applyView);

  requestAnimationFrame(() => {
    if (narrow.matches && view === 'detail') {
      formCol
        .querySelector<HTMLInputElement>('.qr-title-input')
        ?.focus({ preventScroll: true });
      return;
    }
    const target =
      listCol.querySelector<HTMLElement>('.qr-selected') ??
      listCol.querySelector<HTMLElement>('.qr-list-item') ??
      listCol.querySelector<HTMLElement>('.qr-add');
    target?.focus({ preventScroll: true });
  });

  return () => {
    narrow.removeEventListener('change', applyView);
    teardownEditor();
    for (const t of listTemplates())
      if (!t.title.trim() && !t.body.trim()) removeTemplate(t.id);
  };
}

function exportToFile(): void {
  const json = JSON.stringify(listTemplates(), null, 2);
  const url = URL.createObjectURL(
    new Blob([json], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quick-replies.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importFromFile(after: () => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    void file?.text().then((text) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return;
      }
      if (!Array.isArray(parsed)) return;
      const incoming = parsed
        .filter(
          (v): v is Record<string, unknown> =>
            !!v &&
            typeof v === 'object' &&
            typeof (v as Record<string, unknown>).title === 'string' &&
            typeof (v as Record<string, unknown>).body === 'string',
        )
        .map(
          (v): Template => ({
            id: crypto.randomUUID(),
            title: v.title as string,
            body: v.body as string,
          }),
        );
      setTemplates([...listTemplates(), ...incoming]);
      after();
    });
  });
  input.click();
}

const STYLES = `
.qr-strip { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; justify-content: flex-start; margin: 8px 0; }
.qr-strip-btn { max-width: 16rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 4px 10px; font: inherit; font-size: 13px; color: inherit; background: none; border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; cursor: pointer; }
.qr-strip-btn:hover { background: var(--color-section-lighten-10, #2a3852); }
.qr-strip-flame { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; font: inherit; font-size: 13px; font-weight: 700; color: var(--palette-text-yellow, #ffd666); background: none; border: none; border-radius: 4px; cursor: pointer; }
.qr-strip-flame:hover { background: var(--color-section-lighten-10, #2a3852); }
.qr-strip-more { padding: 4px 8px; font: inherit; font-size: 13px; color: var(--color-text-muted, #9aa6bd); background: none; border: none; border-radius: 4px; cursor: pointer; }
.qr-strip-more:hover { color: inherit; text-decoration: underline; }
.qr-body { display: flex; min-height: 0; flex: 1; }
.qr-editor { width: 100%; box-sizing: border-box; }
.qr-editor textarea, .qr-editor .dtext-formatter { width: 100%; max-width: 100%; box-sizing: border-box; }
.qr-list { width: 220px; flex: none; border-right: 1px solid var(--color-table-border, #313d52); padding: 8px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.qr-list-item { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 7px 9px; text-align: left; border: none; background: none; color: inherit; border-radius: 4px; cursor: pointer; font: inherit; font-size: 13px; }
.qr-list-item:hover { background: var(--color-section-lighten-5, #28323f); }
.qr-selected { background: var(--color-section-lighten-10, #2a3852); }
.qr-list-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qr-pin-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--palette-text-yellow, #ffd666); flex: none; }
.qr-add { display: flex; align-items: center; gap: 6px; padding: 7px 9px; border: 1px dashed var(--color-table-border, #313d52); background: none; color: inherit; border-radius: 4px; cursor: pointer; font: inherit; font-size: 13px; margin-top: 4px; }
.qr-add:hover { background: var(--color-section-lighten-5, #28323f); }
.qr-list-actions { margin-top: auto; display: flex; flex-direction: column; gap: 6px; padding-top: 4px; }
.qr-add-row { display: flex; gap: 6px; align-items: stretch; }
.qr-add-row .qr-add { flex: 1; margin-top: 0; }
.qr-more-btn { border: 1px dashed var(--color-table-border, #313d52); border-radius: 4px; color: var(--color-text-muted, #9aa6bd); }
.qr-more-btn:hover { color: inherit; background: var(--color-section-lighten-5, #28323f); }
.qr-tool-menu { display: flex; gap: 6px; }
.qr-tool-menu[hidden] { display: none; }
.qr-tool-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; flex: 1; padding: 6px 8px; font: inherit; font-size: 12px; color: var(--color-text-muted, #9aa6bd); background: none; border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; cursor: pointer; }
.qr-tool-btn:hover { color: inherit; background: var(--color-section-lighten-5, #28323f); }
.qr-form { flex: 1; min-width: 0; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
.qr-empty { color: var(--color-text-muted, #9aa6bd); font-size: 13px; margin: auto; }
.qr-title-input, .qr-body-input { width: 100%; box-sizing: border-box; padding: 8px 10px; font: inherit; color: inherit; background: var(--color-section-darken-5, rgba(0,0,0,0.2)); border: 1px solid var(--color-table-border, #313d52); border-radius: 4px; }
.qr-body-input { resize: vertical; font-family: monospace; font-size: 13px; }
.qr-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.qr-chips-label { font-size: 12px; color: var(--color-text-muted, #9aa6bd); }
.qr-chip { padding: 2px 7px; font: inherit; font-size: 11px; color: inherit; background: var(--color-section-lighten-5, #28323f); border: 1px solid var(--color-table-border, #313d52); border-radius: 3px; cursor: pointer; }
.qr-chip:hover { border-color: var(--palette-text-yellow, #ffd666); }
.qr-title-row { display: flex; align-items: center; gap: 6px; min-height: 40px; }
.qr-title-row .qr-title-input { flex: 1; }
.qr-icon-btn { display: inline-flex; align-items: center; justify-content: center; padding: 5px; min-width: 28px; background: none; border: none; color: inherit; border-radius: 4px; cursor: pointer; }
.qr-icon-btn:hover { background: var(--color-section-lighten-10, #2a3852); }
.qr-icon-btn.qr-pinned { color: var(--palette-text-yellow, #ffd666); }
.qr-danger:hover { color: #ff6b6b; }
.qr-confirm { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 4px 10px; border: 1px solid #ff6b6b; border-radius: 4px; }
.qr-confirm span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qr-confirm-yes, .qr-confirm-no { padding: 4px 12px; font: inherit; font-size: 13px; border-radius: 4px; cursor: pointer; }
.qr-confirm-yes { color: #fff; background: #d64545; border: 1px solid #d64545; }
.qr-confirm-yes:hover { background: #ff6b6b; }
.qr-confirm-no { color: inherit; background: none; border: 1px solid var(--color-table-border, #313d52); }
.qr-confirm-no:hover { background: var(--color-section-lighten-10, #2a3852); }
@media (max-width: 640px) {
  .qr-body { flex-direction: column; }
  .qr-list { width: auto; flex: 1 1 auto; border-right: none; border-bottom: 1px solid var(--color-table-border, #313d52); }
  .qr-body.qr-view-detail .qr-list { display: none; }
  .qr-body.qr-view-list .qr-form { display: none; }
}
`;
