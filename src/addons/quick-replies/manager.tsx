import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Download, MoreHorizontal, Pin, Plus, Trash2, Upload } from 'lucide-preact';

import type { DialogCrumb } from '../../core/palette/dialog';
import { buildDTextEditor } from '../../core/palette/dtextEditor';
import { deepActiveElement } from '../../core/palette/focus';
import { rove } from '../../core/palette/rove';
import { spawnDialog } from '../../core/palette/spawnDialog';
import type { ReplyContext } from './context';
import { type Template } from './store';
import { ensureStyles, STYLES } from './styles';

export function openManager(context: ReplyContext, initialBody?: string): void {
  // The slotted editor is light DOM, so it needs the sheet in document.head.
  ensureStyles();
  const initialId =
    initialBody !== undefined ? context.store.add('', initialBody).id : undefined;
  spawnDialog({
    trail: [{ title: context.manageTitle }],
    styles: STYLES,
    render: (host, _close, setTrail) => {
      render(
        <Manager context={context} initialId={initialId} setTrail={setTrail} />,
        host,
      );
      return () => render(null, host);
    },
  });
}

function useTemplates(context: ReplyContext): Template[] {
  const [, force] = useState(0);
  useEffect(() => context.store.subscribe(() => force((n) => n + 1)), [context]);
  return context.store.list();
}

function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(
    () => window.matchMedia('(max-width: 640px)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const onChange = (): void => setNarrow(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return narrow;
}

function exportToFile(context: ReplyContext): void {
  const json = JSON.stringify(context.store.list(), null, 2);
  const url = URL.createObjectURL(
    new Blob([json], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = context.exportName;
  a.click();
  URL.revokeObjectURL(url);
}

function importFromFile(context: ReplyContext): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', () => {
    void input.files?.[0]?.text().then((text) => {
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
            pinned: v.pinned === true,
          }),
        );
      context.store.set([...context.store.list(), ...incoming]);
    });
  });
  input.click();
}

function Manager({
  context,
  initialId,
  setTrail,
}: {
  context: ReplyContext;
  initialId?: string;
  setTrail: (trail: DialogCrumb[]) => void;
}) {
  const store = context.store;
  const templates = useTemplates(context);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialId ?? templates[0]?.id,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<'list' | 'detail'>(
    initialId ? 'detail' : 'list',
  );
  const narrow = useNarrow();
  const selected = templates.find((t) => t.id === selectedId);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const toolMenuRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    if (menuOpen) toolMenuRef.current?.querySelector('button')?.focus();
  }, [menuOpen]);

  // A draft left with neither a title nor a body is not worth keeping.
  useEffect(
    () => () => {
      for (const t of store.list())
        if (!t.title.trim() && !t.body.trim()) store.remove(t.id);
    },
    [store],
  );

  // Drop the dragged reply ahead of the one it was dropped on.
  const reorderTo = (targetId: string): void => {
    const from = dragId.current;
    if (!from || from === targetId) return;
    const list = store.list();
    const fromIndex = list.findIndex((t) => t.id === from);
    const toIndex = list.findIndex((t) => t.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...list];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    store.set(next);
  };

  useEffect(() => {
    if (narrow && view === 'detail') {
      setTrail([
        { title: context.manageTitle, onClick: showList },
        { title: selected?.title || '(untitled)' },
      ]);
    } else {
      setTrail([{ title: context.manageTitle }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrow, view, selected?.title, setTrail]);

  function focusDetail(): void {
    requestAnimationFrame(() =>
      rootRef.current?.querySelector<HTMLElement>('.sp-qr-title-input')?.focus(),
    );
  }
  function focusList(): void {
    requestAnimationFrame(() =>
      rootRef.current
        ?.querySelector<HTMLElement>(
          '.sp-qr-list-item.sp-qr-selected, .sp-qr-list-item',
        )
        ?.focus(),
    );
  }
  function showList(): void {
    setView('list');
    focusList();
  }
  function select(id: string | undefined): void {
    setSelectedId(id);
    if (narrow) {
      setView('detail');
      focusDetail();
    }
  }

  const rovingId = templates.some((t) => t.id === selectedId)
    ? selectedId
    : templates[0]?.id;

  const MEMBER = '.sp-qr-list-item, .sp-qr-add, .sp-qr-more-btn';
  const members = (): HTMLElement[] =>
    Array.from(listRef.current?.querySelectorAll<HTMLElement>(MEMBER) ?? []);
  const focusMember = (el: HTMLElement | undefined): void => {
    if (!el) return;
    for (const m of members()) m.tabIndex = m === el ? 0 : -1;
    el.focus();
  };
  const onListKeyDown = (event: KeyboardEvent): void => {
    const active = deepActiveElement();
    if (!(active instanceof HTMLElement) || !active.matches(MEMBER)) return;
    const items = members();
    const index = items.indexOf(active);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const id = active.dataset.id;
      if (event.altKey && id) {
        store.move(id, delta);
        requestAnimationFrame(() =>
          focusMember(
            listRef.current?.querySelector<HTMLElement>(
              `.sp-qr-list-item[data-id="${id}"]`,
            ) ?? undefined,
          ),
        );
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
  };

  return (
    <div class={'sp-qr-manager sp-qr-view-' + view} ref={rootRef}>
      <div class="sp-qr-list" ref={listRef} tabIndex={-1} onKeyDown={onListKeyDown}>
        {templates.map((template) => (
          <button
            type="button"
            key={template.id}
            data-id={template.id}
            draggable
            tabIndex={template.id === rovingId ? 0 : -1}
            class={
              'sp-qr-list-item' +
              (template.id === selectedId ? ' sp-qr-selected' : '') +
              (overId === template.id ? ' sp-qr-drop-over' : '')
            }
            onClick={() => select(template.id)}
            onDragStart={() => (dragId.current = template.id)}
            onDragOver={(e) => {
              e.preventDefault();
              if (
                dragId.current &&
                dragId.current !== template.id &&
                overId !== template.id
              )
                setOverId(template.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              reorderTo(template.id);
              setOverId(null);
            }}
            onDragEnd={() => {
              dragId.current = null;
              setOverId(null);
            }}
          >
            <span class="sp-qr-list-name">{template.title || '(untitled)'}</span>
            {template.pinned && (
              <span class="sp-qr-pin-dot" title="Shown on the strip" />
            )}
          </button>
        ))}
        <div class="sp-qr-list-actions">
          <div class="sp-qr-add-row">
            <button
              type="button"
              class="sp-qr-add"
              tabIndex={templates.length ? -1 : 0}
              onClick={() => select(store.add('', '').id)}
            >
              <Plus size={16} />
              <span>{context.addLabel}</span>
            </button>
            <button
              type="button"
              class="sp-qr-more-btn"
              tabIndex={-1}
              title="Import or export"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
          {menuOpen && (
            <div class="sp-qr-tool-menu" ref={toolMenuRef}>
              <button
                type="button"
                class="sp-qr-tool-btn"
                onClick={() => exportToFile(context)}
              >
                <Download size={16} />
                <span>Export</span>
              </button>
              <button
                type="button"
                class="sp-qr-tool-btn"
                onClick={() => importFromFile(context)}
              >
                <Upload size={16} />
                <span>Import</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <div class="sp-qr-form" tabIndex={-1}>
        {selected ? (
          <Editor
            key={selected.id}
            context={context}
            template={selected}
            onDelete={() => {
              store.remove(selected.id);
              setSelectedId(store.list()[0]?.id);
              if (narrow) showList();
            }}
          />
        ) : (
          <div class="sp-qr-empty">{context.emptyHint}</div>
        )}
      </div>
    </div>
  );
}

function Editor({
  context,
  template,
  onDelete,
}: {
  context: ReplyContext;
  template: Template;
  onDelete: () => void;
}) {
  const store = context.store;
  const id = template.id;
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  // The DText editor is light DOM, so it is slotted into the shadow dialog.
  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;
    const editor = buildDTextEditor({
      value: template.body,
      className: 'sp-qr-editor',
      rows: 9,
      placeholder: context.bodyPlaceholder,
      onInput: (value) => store.update(id, { body: value }),
    });
    textareaRef.current = editor.textarea;
    const root = container.getRootNode();
    const shadowHost =
      root instanceof ShadowRoot ? (root.host as HTMLElement) : null;
    let slot: HTMLSlotElement | undefined;
    if (shadowHost) {
      editor.node.slot = 'sp-qr-body';
      shadowHost.appendChild(editor.node);
      slot = document.createElement('slot');
      slot.setAttribute('name', 'sp-qr-body');
      container.appendChild(slot);
    } else {
      container.appendChild(editor.node);
    }
    return () => {
      try {
        editor.formatter?.destroy?.();
      } catch {
        // ignore a formatter that fails to clean up
      }
      editor.node.remove();
      slot?.remove();
      textareaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onConfirmKeyDown = (event: KeyboardEvent): void => {
    const current = deepActiveElement();
    if (!(current instanceof HTMLElement)) return;
    const buttons = Array.from(
      confirmRef.current?.querySelectorAll<HTMLElement>('button') ?? [],
    );
    const index = buttons.indexOf(current);
    if (index < 0) return;
    let target: HTMLElement | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      target = buttons[index + 1];
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      target = buttons[index - 1];
    else if (event.key === 'Home') target = buttons[0];
    else if (event.key === 'End') target = buttons[buttons.length - 1];
    else return;
    event.preventDefault();
    if (!target) return;
    current.tabIndex = -1;
    target.tabIndex = 0;
    target.focus();
  };

  const empty = !template.title.trim() && !template.body.trim();

  const insertVariable = (token: string): void => {
    const area = textareaRef.current;
    if (!area) return;
    const mark = `%${token}%`;
    const { selectionStart: start, selectionEnd: end } = area;
    area.value = area.value.slice(0, start) + mark + area.value.slice(end);
    area.selectionStart = area.selectionEnd = start + mark.length;
    area.focus();
    area.dispatchEvent(new Event('input', { bubbles: true }));
  };

  return (
    <>
      {confirming ? (
        <div class="sp-qr-confirm" ref={confirmRef} onKeyDown={onConfirmKeyDown}>
          <span>Delete "{template.title || '(untitled)'}"?</span>
          <button
            type="button"
            class="sp-qr-confirm-yes"
            tabIndex={-1}
            onClick={onDelete}
          >
            Delete
          </button>
          <button
            type="button"
            class="sp-qr-confirm-no"
            ref={cancelRef}
            tabIndex={0}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div class="sp-qr-title-row">
          <input
            type="text"
            class="sp-qr-title-input"
            placeholder="Title"
            value={template.title}
            onInput={(e) => store.update(id, { title: e.currentTarget.value })}
          />
          <button
            type="button"
            class={'sp-qr-icon-btn' + (template.pinned ? ' sp-qr-pinned' : '')}
            title={template.pinned ? 'Shown on the strip' : 'Show on the strip'}
            onClick={() => store.update(id, { pinned: !template.pinned })}
          >
            <Pin size={16} fill={template.pinned ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            class="sp-qr-icon-btn sp-qr-danger"
            title="Delete reply"
            onClick={() => (empty ? onDelete() : setConfirming(true))}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      <div ref={bodyRef} />

      <div
        class="sp-qr-chips"
        ref={chipsRef}
        onKeyDown={(e) => rove(chipsRef.current, e, '.sp-qr-chip')}
      >
        <span class="sp-qr-chips-label">Insert:</span>
        {context.variables.map((variable, index) => (
          <button
            type="button"
            key={variable.token}
            tabIndex={index === 0 ? 0 : -1}
            class="sp-qr-chip"
            title={`Inserts %${variable.token}%`}
            onClick={() => insertVariable(variable.token)}
          >
            {variable.label}
          </button>
        ))}
      </div>
    </>
  );
}
