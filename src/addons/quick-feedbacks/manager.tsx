import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  ChevronDown,
  ChevronUp,
  Download,
  MoreHorizontal,
  Pin,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-preact';

import type { DialogCrumb } from '../../core/palette/dialog';
import { buildDTextEditor } from '../../core/palette/dtextEditor';
import { deepActiveElement } from '../../core/palette/focus';
import { spawnDialog } from '../../core/palette/spawnDialog';
import { exportJson, importJson } from '../../core/transfer';
import { RULES } from './rules';
import { RuleGroups } from './ruleGroups';
import { rove } from '../../core/palette/rove';
import { recordStore, type RecordCategory, type RecordTemplate } from './store';
import { ensureStyles, STYLES } from './styles';

export function openRecordsManager(): void {
  // buildDTextEditor's node is slotted light DOM, which only a sheet in
  // document.head reaches.
  ensureStyles();
  spawnDialog({
    trail: [{ title: 'Manage quick feedbacks' }],
    styles: STYLES,
    render: (host, _close, setTrail) => {
      render(<Manager setTrail={setTrail} />, host);
      return () => render(null, host);
    },
  });
}

function exportToFile(): void {
  exportJson('quick-feedbacks', recordStore.list());
}

function importFromFile(): void {
  importJson<RecordTemplate>(
    (v) =>
      typeof v.title === 'string' && typeof v.reason === 'string'
        ? {
            id: crypto.randomUUID(),
            title: v.title,
            reason: v.reason,
            rules: Array.isArray(v.rules)
              ? v.rules.filter((r): r is string => typeof r === 'string')
              : [],
            pinned: v.pinned === true,
          }
        : null,
    (incoming) => recordStore.set([...recordStore.list(), ...incoming]),
  );
}

function useRecords(): RecordTemplate[] {
  const [, force] = useState(0);
  useEffect(() => recordStore.subscribe(() => force((n) => n + 1)), []);
  return recordStore.list();
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

const CATEGORIES: { value: RecordCategory; label: string }[] = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'ban', label: 'Ban' },
];

const DURATIONS: { value: number; label: string }[] = [
  { value: 1, label: '1 day' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: -1, label: 'Permanent' },
];

function Manager({ setTrail }: { setTrail: (trail: DialogCrumb[]) => void }) {
  const records = useRecords();
  const [selectedId, setSelectedId] = useState<string | undefined>(
    records[0]?.id,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const narrow = useNarrow();
  const selected = records.find((t) => t.id === selectedId);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const toolMenuRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    if (menuOpen) toolMenuRef.current?.querySelector('button')?.focus();
  }, [menuOpen]);

  const reorderTo = (targetId: string): void => {
    const from = dragId.current;
    if (!from || from === targetId) return;
    const list = recordStore.list();
    const fromIndex = list.findIndex((t) => t.id === from);
    const toIndex = list.findIndex((t) => t.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...list];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    recordStore.set(next);
  };

  useEffect(() => {
    if (narrow && view === 'detail') {
      setTrail([
        { title: 'Manage quick feedbacks', onClick: showList },
        { title: selected?.title || '(untitled)' },
      ]);
    } else {
      setTrail([{ title: 'Manage quick feedbacks' }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrow, view, selected?.title, setTrail]);

  function focusDetail(): void {
    requestAnimationFrame(() =>
      rootRef.current
        ?.querySelector<HTMLElement>('.sp-qf-editor .sp-qf-input')
        ?.focus(),
    );
  }
  function focusList(): void {
    requestAnimationFrame(() =>
      rootRef.current
        ?.querySelector<HTMLElement>(
          '.sp-qf-list-item.sp-qf-selected, .sp-qf-list-item',
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

  const rovingId = records.some((t) => t.id === selectedId)
    ? selectedId
    : records[0]?.id;

  const MEMBER = '.sp-qf-list-item, .sp-qf-add, .sp-qf-more-btn';
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
        recordStore.move(id, delta);
        requestAnimationFrame(() =>
          focusMember(
            listRef.current?.querySelector<HTMLElement>(
              `.sp-qf-list-item[data-id="${id}"]`,
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
    <div class={'sp-qf-manager sp-qf-view-' + view} ref={rootRef}>
      <div
        class="sp-qf-list"
        ref={listRef}
        tabIndex={-1}
        onKeyDown={onListKeyDown}
      >
        {records.map((template) => (
          <button
            type="button"
            key={template.id}
            data-id={template.id}
            draggable
            tabIndex={template.id === rovingId ? 0 : -1}
            class={
              'sp-qf-list-item' +
              (template.id === selectedId ? ' sp-qf-selected' : '') +
              (overId === template.id ? ' sp-qf-drop-over' : '')
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
            <span class="sp-qf-list-name">
              {template.title || '(untitled)'}
            </span>
            {template.pinned && (
              <span class="sp-qf-pin-dot" title="Shown on the strip" />
            )}
          </button>
        ))}
        <div class="sp-qf-list-actions">
          <div class="sp-qf-add-row">
            <button
              type="button"
              class="sp-qf-add"
              tabIndex={records.length ? -1 : 0}
              onClick={() =>
                select(recordStore.add({ title: '', reason: '', rules: [] }).id)
              }
            >
              <Plus size={16} />
              <span>New</span>
            </button>
            <button
              type="button"
              class="sp-qf-more-btn"
              tabIndex={-1}
              title={menuOpen ? 'Close' : 'Import or export'}
              aria-expanded={menuOpen ? 'true' : 'false'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X size={16} /> : <MoreHorizontal size={16} />}
            </button>
          </div>
          {menuOpen && (
            <div class="sp-qf-tool-menu" ref={toolMenuRef}>
              <button
                type="button"
                class="sp-qf-tool-btn"
                onClick={exportToFile}
              >
                <Download size={16} />
                <span>Export</span>
              </button>
              <button
                type="button"
                class="sp-qf-tool-btn"
                onClick={importFromFile}
              >
                <Upload size={16} />
                <span>Import</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <div class="sp-qf-editor" tabIndex={-1}>
        {selected ? (
          <Editor
            key={selected.id}
            template={selected}
            onDelete={() => {
              recordStore.remove(selected.id);
              setSelectedId(recordStore.list()[0]?.id);
              if (narrow) showList();
            }}
          />
        ) : (
          <div class="sp-qf-empty">Select a template, or add one.</div>
        )}
      </div>
    </div>
  );
}

function Editor({
  template,
  onDelete,
}: {
  template: RecordTemplate;
  onDelete: () => void;
}) {
  const id = template.id;
  const [confirming, setConfirming] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(
    template.rules.length === 0,
  );
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const rulesRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  useEffect(() => {
    const container = reasonRef.current;
    if (!container) return;
    const editor = buildDTextEditor({
      value: template.reason,
      className: 'sp-qf-reason-editor',
      rows: 5,
      placeholder: 'Reason',
      onInput: (value) => recordStore.update(id, { reason: value }),
    });
    const root = container.getRootNode();
    const shadowHost =
      root instanceof ShadowRoot ? (root.host as HTMLElement) : null;
    let slot: HTMLSlotElement | undefined;
    if (shadowHost) {
      editor.node.slot = 'sp-qf-reason';
      shadowHost.appendChild(editor.node);
      slot = document.createElement('slot');
      slot.setAttribute('name', 'sp-qf-reason');
      container.appendChild(slot);
    } else {
      container.appendChild(editor.node);
    }
    return () => {
      try {
        editor.formatter?.destroy?.();
      } catch {
        // A formatter that throws on destroy leaves nothing to undo.
      }
      editor.node.remove();
      slot?.remove();
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

  const empty =
    !template.title.trim() && !template.reason.trim() && !template.rules.length;

  const toggleRule = (key: string): void => {
    const next = new Set(template.rules);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    recordStore.update(id, { rules: [...next] });
  };

  return (
    <>
      {confirming ? (
        <div
          class="sp-qf-confirm"
          ref={confirmRef}
          onKeyDown={onConfirmKeyDown}
        >
          <span>Delete "{template.title || '(untitled)'}"?</span>
          <button
            type="button"
            class="sp-qf-confirm-yes"
            tabIndex={-1}
            onClick={onDelete}
          >
            Delete
          </button>
          <button
            type="button"
            class="sp-qf-confirm-no"
            ref={cancelRef}
            tabIndex={0}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div class="sp-qf-title-row">
          <input
            type="text"
            class="sp-qf-input"
            placeholder="Title"
            value={template.title}
            onInput={(e) =>
              recordStore.update(id, { title: e.currentTarget.value })
            }
          />
          <button
            type="button"
            class={'sp-qf-icon-btn' + (template.pinned ? ' sp-qf-pinned' : '')}
            title={template.pinned ? 'Shown on the strip' : 'Show on the strip'}
            onClick={() => recordStore.update(id, { pinned: !template.pinned })}
          >
            <Pin size={16} fill={template.pinned ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            class="sp-qf-icon-btn sp-qf-danger"
            title="Delete template"
            onClick={() => (empty ? onDelete() : setConfirming(true))}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      <div class="sp-qf-label">Reason</div>
      <div
        ref={reasonRef}
        class="sp-qf-reason-slot"
        dangerouslySetInnerHTML={{ __html: '' }}
      />

      <div class="sp-qf-label">Category</div>
      <div
        class="sp-qf-rules"
        ref={categoryRef}
        onKeyDown={(e) => rove(categoryRef.current, e, '.sp-qf-pill')}
      >
        <button
          type="button"
          tabIndex={0}
          class={
            'sp-qf-pill sp-qf-cat-none' +
            (!template.category ? ' sp-qf-on' : '')
          }
          onClick={() => recordStore.update(id, { category: undefined })}
        >
          None
        </button>
        {CATEGORIES.map((category) => (
          <button
            type="button"
            key={category.value}
            tabIndex={-1}
            class={
              'sp-qf-pill sp-qf-cat-' +
              category.value +
              (template.category === category.value ? ' sp-qf-on' : '')
            }
            onClick={() => recordStore.update(id, { category: category.value })}
          >
            {category.label}
          </button>
        ))}
      </div>

      {template.category === 'ban' && (
        <>
          <div class="sp-qf-label">Duration</div>
          <div
            class="sp-qf-rules"
            ref={durationRef}
            onKeyDown={(e) =>
              rove(durationRef.current, e, '.sp-qf-pill, .sp-qf-duration')
            }
          >
            {DURATIONS.map((option, index) => (
              <button
                type="button"
                key={option.value}
                tabIndex={index === 0 ? 0 : -1}
                class={
                  'sp-qf-pill' +
                  (template.duration === option.value ? ' sp-qf-on' : '')
                }
                onClick={() =>
                  recordStore.update(id, { duration: option.value })
                }
              >
                {option.label}
              </button>
            ))}
            <input
              type="number"
              min="-1"
              tabIndex={-1}
              class="sp-qf-duration"
              placeholder="Custom days"
              value={template.duration != null ? String(template.duration) : ''}
              onInput={(e) => {
                const value = e.currentTarget.value;
                recordStore.update(id, {
                  duration: value === '' ? undefined : Number(value),
                });
              }}
            />
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={template.preventLogin ? 'true' : 'false'}
            class="sp-qf-switch-row"
            onClick={() =>
              recordStore.update(id, { preventLogin: !template.preventLogin })
            }
          >
            <span>Prevent login</span>
            <span
              class={
                'sp-qf-switch' +
                (template.preventLogin ? ' sp-qf-switch-on' : '')
              }
            />
          </button>
        </>
      )}

      <div class="sp-qf-label">Rules</div>
      {rulesExpanded ? (
        <>
          <div class="sp-qf-rules-scroll" tabIndex={-1}>
            <RuleGroups
              isActive={(key) => template.rules.includes(key)}
              onToggle={toggleRule}
            />
          </div>
          <button
            type="button"
            class="sp-qf-more"
            onClick={() => setRulesExpanded(false)}
          >
            <span>Less</span>
            <ChevronUp size={14} />
          </button>
        </>
      ) : (
        <div
          class="sp-qf-rules"
          ref={rulesRef}
          onKeyDown={(e) =>
            rove(rulesRef.current, e, '.sp-qf-pill, .sp-qf-more')
          }
        >
          {template.rules.map((key, index) => (
            <button
              type="button"
              key={key}
              tabIndex={index === 0 ? 0 : -1}
              class="sp-qf-pill sp-qf-on"
              onClick={() => toggleRule(key)}
            >
              {RULES[key].title}
            </button>
          ))}
          <button
            type="button"
            class="sp-qf-more"
            tabIndex={template.rules.length ? -1 : 0}
            onClick={() => setRulesExpanded(true)}
          >
            <span>{template.rules.length ? 'More' : 'Add rules'}</span>
            <ChevronDown size={14} />
          </button>
        </div>
      )}
    </>
  );
}
