import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  Download,
  GripVertical,
  MapPin,
  MoreHorizontal,
  Pin,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-preact';

import { rove } from '../../core/palette/rove';
import { spawnDialog } from '../../core/palette/spawnDialog';
import { exportJson, importJson } from '../../core/transfer';
import { ICONS, iconFor } from './icons';
import { navStore, type NavEntry } from './store';
import { toPath } from './url';
import STYLES from './styles.css?inline';

export const MANAGER_TITLE = 'Manage jumps';

// Every focusable cell of a row carries this, so the keys can walk the grid and
// roving can hand out the single tab stop.
const CONTROL = '.sp-nav-control';
const ROW = '.sp-nav-row';

// Where a row's name field sits, and where the keyboard enters a row.
const NAME_COLUMN = 1;

interface Cell {
  id: string;
  column: number;
}

type Caret = 'start' | 'end';

type ToolMode = 'tools' | 'menu' | 'confirm';

function exportToFile(): void {
  exportJson('navbar', navStore.list());
}

// Imported entries join the list rather than replace it, and the store puts the
// pinned ones back in front. Anything without a title and url is not an entry.
function importFromFile(): void {
  importJson<NavEntry>(
    (value) =>
      typeof value.title === 'string' && typeof value.url === 'string'
        ? {
            id: crypto.randomUUID(),
            title: value.title,
            url: value.url,
            icon: typeof value.icon === 'string' ? value.icon : undefined,
            pinned: value.pinned === true,
          }
        : null,
    (incoming) => navStore.set([...navStore.list(), ...incoming]),
  );
}

// Whether a horizontal step should leave the cell: a text field keeps the key
// until its caret sits collapsed against the edge it is heading for.
function atEdge(element: HTMLElement, delta: number): boolean {
  if (!(element instanceof HTMLInputElement)) return true;
  const { selectionStart: start, selectionEnd: end } = element;
  if (start === null || end === null || start !== end) return false;
  return delta < 0 ? start === 0 : start === element.value.length;
}

export function openNavManager(): void {
  spawnDialog({
    trail: [{ title: MANAGER_TITLE }],
    styles: STYLES,
    render: (host) => {
      render(<Manager />, host);
      return () => render(null, host);
    },
  });
}

function useEntries(): NavEntry[] {
  const [, force] = useState(0);
  useEffect(() => navStore.subscribe(() => force((n) => n + 1)), []);
  return navStore.list();
}

function IconPicker({
  selected,
  onPick,
  onDismiss,
}: {
  selected: string | undefined;
  onPick: (key: string) => void;
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // The grid's single tab stop starts on the icon the entry already wears.
  const focused = ICONS.some((icon) => icon.key === selected)
    ? selected
    : ICONS[0].key;

  useEffect(() => {
    ref.current
      ?.querySelector<HTMLElement>('.sp-nav-picker-btn[tabindex="0"]')
      ?.focus();
  }, []);

  return (
    <div
      class="sp-nav-picker"
      ref={ref}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          // The dialog closes on Escape too, so the picker takes it first.
          event.stopPropagation();
          onDismiss();
          return;
        }
        rove(ref.current, event, '.sp-nav-picker-btn');
      }}
    >
      {ICONS.map(({ key, label, Icon }) => (
        <button
          type="button"
          key={key}
          class={'sp-nav-picker-btn' + (key === selected ? ' sp-nav-on' : '')}
          title={label}
          aria-label={label}
          tabIndex={key === focused ? 0 : -1}
          onClick={() => onPick(key)}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}

function Row({
  entry,
  activeColumn,
  picking,
  dragging,
  dropping,
  onPicking,
  onRemove,
}: {
  entry: NavEntry;
  // The one cell of this row that holds the list's tab stop, if any.
  activeColumn: number | null;
  picking: boolean;
  dragging: boolean;
  dropping: 'above' | 'below' | null;
  onPicking: (open: boolean) => void;
  onRemove: () => void;
}) {
  const Icon = iconFor(entry.icon);
  const tab = (column: number): number => (activeColumn === column ? 0 : -1);
  const iconRef = useRef<HTMLButtonElement>(null);
  // Closing the picker takes the focused button with it, so hand focus back to
  // the control that opened it rather than dropping it on the document.
  const closePicker = (): void => {
    onPicking(false);
    iconRef.current?.focus();
  };
  return (
    <div class="sp-nav-row-group">
      <div
        class={
          'sp-nav-row' +
          (dragging ? ' sp-nav-dragging' : '') +
          (dropping ? ' sp-nav-drop-' + dropping : '')
        }
        data-id={entry.id}
        role="group"
        aria-label={entry.title || entry.url}
      >
        {entry.pinned ? (
          <span class="sp-nav-grip" draggable title="Drag to reorder">
            <GripVertical size={16} />
          </span>
        ) : (
          <span class="sp-nav-grip sp-nav-grip-blank" />
        )}
        <button
          type="button"
          class={'sp-nav-control sp-nav-icon' + (picking ? ' sp-nav-on' : '')}
          title="Choose an icon"
          aria-expanded={picking ? 'true' : 'false'}
          ref={iconRef}
          tabIndex={tab(0)}
          onClick={() => onPicking(!picking)}
        >
          <Icon size={16} />
        </button>
        <input
          class="sp-nav-control sp-nav-input sp-nav-title"
          value={entry.title}
          placeholder="Name"
          aria-label="Name"
          tabIndex={tab(1)}
          onInput={(event) =>
            navStore.update(entry.id, { title: event.currentTarget.value })
          }
        />
        <input
          class="sp-nav-control sp-nav-input sp-nav-url"
          value={entry.url}
          placeholder="/posts"
          aria-label="URL"
          title="%username%, %userid%"
          spellcheck={false}
          tabIndex={tab(2)}
          onInput={(event) =>
            navStore.update(entry.id, { url: event.currentTarget.value })
          }
        />
        <button
          type="button"
          class={
            'sp-nav-control sp-nav-toggle' + (entry.pinned ? ' sp-nav-on' : '')
          }
          title={entry.pinned ? 'Pinned' : 'Not pinned'}
          aria-label="Pinned"
          aria-pressed={entry.pinned ? 'true' : 'false'}
          tabIndex={tab(3)}
          onClick={() => navStore.setPinned(entry.id, !entry.pinned)}
        >
          <Pin size={16} fill={entry.pinned ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          class="sp-nav-control sp-nav-remove"
          title="Remove"
          aria-label="Remove"
          tabIndex={tab(4)}
          onClick={onRemove}
        >
          <Trash2 size={16} />
        </button>
      </div>
      {picking && (
        <IconPicker
          selected={entry.icon}
          onPick={(icon) => {
            navStore.update(entry.id, { icon });
            closePicker();
          }}
          onDismiss={closePicker}
        />
      )}
    </div>
  );
}

function Manager() {
  const entries = useEntries();
  const pinned = entries.filter((entry) => entry.pinned);
  const jumps = entries.filter((entry) => !entry.pinned);

  const [picking, setPicking] = useState<string | null>(null);
  const [active, setActive] = useState<Cell | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [mode, setMode] = useState<ToolMode>('tools');
  const listRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);

  // A confirm overlay renders under the dialog, so the reset asks in the tool
  // row instead. Escape backs out a step rather than closing the dialog, and
  // focus lands on the row's safe choice: the kebab on the way back, Cancel on a
  // confirm, the leading button otherwise.
  const rowRef = useRef<HTMLDivElement>(null);
  const previousMode = useRef<ToolMode>('tools');
  useEffect(() => {
    if (mode === previousMode.current) return;
    previousMode.current = mode;
    const buttons = Array.from(
      rowRef.current?.querySelectorAll<HTMLElement>('button') ?? [],
    );
    if (mode === 'tools') moreRef.current?.focus();
    else if (mode === 'confirm') buttons[buttons.length - 1]?.focus();
    else buttons[0]?.focus();
  }, [mode]);

  const onRowEscape = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    setMode(mode === 'confirm' ? 'menu' : 'tools');
  };

  // A row left with neither a name nor a url is not worth keeping.
  useEffect(
    () => () => {
      for (const entry of navStore.list())
        if (!entry.title.trim() && !entry.url.trim()) navStore.remove(entry.id);
    },
    [],
  );

  // The list holds a single tab stop, so entering it lands back on the cell the
  // keyboard left, and leaving it takes one Tab from the last row.
  const roving: Cell | null = entries.some((entry) => entry.id === active?.id)
    ? active
    : entries[0]
      ? { id: entries[0].id, column: NAME_COLUMN }
      : null;

  const rows = (): HTMLElement[] =>
    Array.from(listRef.current?.querySelectorAll<HTMLElement>(ROW) ?? []);
  const rowFor = (id: string): HTMLElement | undefined =>
    rows().find((row) => row.dataset.id === id);
  const controls = (row: HTMLElement): HTMLElement[] =>
    Array.from(row.querySelectorAll<HTMLElement>(CONTROL));

  const focusCell = (id: string, column: number, caret?: Caret): void => {
    const row = rowFor(id);
    const cell = row && controls(row)[column];
    if (!cell) return;
    setActive({ id, column });
    cell.focus();
    if (caret && cell instanceof HTMLInputElement) {
      const at = caret === 'start' ? 0 : cell.value.length;
      cell.setSelectionRange(at, at);
    }
  };

  // A write shifts what each row holds rather than moving the rows, so a cell
  // claimed across one is focused only once the new order has rendered.
  const pendingFocus = useRef<Cell | null>(null);
  const focusAfterRender = (id: string, column: number): void => {
    pendingFocus.current = { id, column };
  };
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    focusCell(target.id, target.column);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.map((entry) => entry.id).join()]);

  const cellAt = (target: EventTarget | null): Cell | null => {
    if (!(target instanceof HTMLElement)) return null;
    const cell = target.closest<HTMLElement>(CONTROL);
    const row = target.closest<HTMLElement>(ROW);
    if (!cell || !row?.dataset.id) return null;
    return { id: row.dataset.id, column: controls(row).indexOf(cell) };
  };

  // Tab and the vertical arrows walk rows, the horizontal ones walk the cells of
  // a row, and alt makes the vertical pair carry the entry to the row it would
  // have moved to. A caret with room left keeps its key.
  const onKeyDown = (event: KeyboardEvent): void => {
    const at = cellAt(event.target);
    if (!at) return;
    const order = rows();
    const index = order.findIndex((row) => row.dataset.id === at.id);

    if (event.key === 'Tab') {
      const next = order[index + (event.shiftKey ? -1 : 1)]?.dataset.id;
      if (!next) return;
      event.preventDefault();
      focusCell(next, at.column);
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      event.preventDefault();
      const next = order[index + delta]?.dataset.id;
      if (!next) return;
      if (event.altKey) {
        if (navStore.moveTo(at.id, next)) focusAfterRender(at.id, at.column);
        return;
      }
      focusCell(next, at.column);
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      if (!(event.target instanceof HTMLElement)) return;
      if (!atEdge(event.target, delta)) return;
      const cell = order[index] && controls(order[index])[at.column + delta];
      if (!cell) return;
      event.preventDefault();
      focusCell(at.id, at.column + delta, delta > 0 ? 'start' : 'end');
    }
  };

  const remove = (id: string): void => {
    const order = rows();
    const index = order.findIndex((row) => row.dataset.id === id);
    const column = order[index] ? controls(order[index]).length - 1 : 0;
    const neighbour =
      order[index + 1]?.dataset.id ?? order[index - 1]?.dataset.id;
    navStore.remove(id);
    if (neighbour) focusAfterRender(neighbour, column);
    else addRef.current?.focus();
  };

  // Only a row the dragged one can actually land on takes the line: the drag
  // starts from a grip, which only the bar has, and the split is not crossable.
  const canDropOn = (id: string): boolean =>
    !!dragId &&
    dragId !== id &&
    !!entries.find((entry) => entry.id === dragId)?.pinned ===
      !!entries.find((entry) => entry.id === id)?.pinned;

  // Which side of the target the dragged row lands on.
  const dropSide = (id: string): 'above' | 'below' | null => {
    if (overId !== id || !canDropOn(id)) return null;
    const order = entries.map((entry) => entry.id);
    return order.indexOf(dragId!) < order.indexOf(id) ? 'below' : 'above';
  };

  const rowProps = (entry: NavEntry) => ({
    key: entry.id,
    entry,
    activeColumn: entry.id === roving?.id ? roving.column : null,
    picking: picking === entry.id,
    dragging: dragId === entry.id,
    dropping: dropSide(entry.id),
    onPicking: (open: boolean) => setPicking(open ? entry.id : null),
    onRemove: () => remove(entry.id),
  });

  // The tool row swaps its contents in place, every state built from the same
  // button box, so the list below never moves.
  const tools = {
    tools: (
      <div class="sp-nav-tools" ref={rowRef}>
        <button
          type="button"
          class="sp-nav-tool"
          ref={addRef}
          onClick={() =>
            focusAfterRender(
              navStore.add({ title: '', url: '' }).id,
              NAME_COLUMN,
            )
          }
        >
          <Plus size={16} />
          <span>Add a jump</span>
        </button>
        <button
          type="button"
          class="sp-nav-tool"
          onClick={() =>
            focusAfterRender(
              navStore.add({
                title: document.title,
                url: toPath(location.href),
                pinned: true,
              }).id,
              NAME_COLUMN,
            )
          }
        >
          <MapPin size={16} />
          <span>Pin this page</span>
        </button>
        <button
          type="button"
          class="sp-nav-tool sp-nav-tool-end"
          title="More"
          aria-label="More"
          ref={moreRef}
          onClick={() => setMode('menu')}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    ),
    menu: (
      <div class="sp-nav-tools" ref={rowRef} onKeyDown={onRowEscape}>
        <button type="button" class="sp-nav-tool" onClick={exportToFile}>
          <Download size={16} />
          <span>Export</span>
        </button>
        <button type="button" class="sp-nav-tool" onClick={importFromFile}>
          <Upload size={16} />
          <span>Import</span>
        </button>
        <button
          type="button"
          class="sp-nav-tool"
          title="Reset to defaults"
          onClick={() => setMode('confirm')}
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          class="sp-nav-tool sp-nav-tool-end"
          aria-label="Close"
          onClick={() => setMode('tools')}
        >
          <X size={16} />
        </button>
      </div>
    ),
    confirm: (
      <div
        class="sp-nav-tools sp-nav-confirm"
        ref={rowRef}
        onKeyDown={onRowEscape}
      >
        <span class="sp-nav-confirm-text">Reset to defaults?</span>
        <button
          type="button"
          class="sp-nav-tool sp-nav-confirm-yes"
          onClick={() => {
            navStore.reset();
            setMode('tools');
          }}
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          class="sp-nav-tool"
          onClick={() => setMode('tools')}
        >
          <X size={16} />
          <span>Cancel</span>
        </button>
      </div>
    ),
  }[mode];

  return (
    <div class="sp-nav-manager">
      {tools}

      <div
        class="sp-nav-list"
        ref={listRef}
        onKeyDown={onKeyDown}
        onFocusIn={(event) => {
          const at = cellAt(event.target);
          if (at) setActive(at);
        }}
        onDragStart={(event) => {
          const row = (event.target as HTMLElement).closest<HTMLElement>(ROW);
          setDragId(row?.dataset.id ?? null);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          const row = (event.target as HTMLElement).closest<HTMLElement>(ROW);
          const id = row?.dataset.id;
          if (id && id !== overId) setOverId(id);
        }}
        onDrop={(event) => {
          event.preventDefault();
          const row = (event.target as HTMLElement).closest<HTMLElement>(ROW);
          const id = row?.dataset.id;
          if (id && dragId && canDropOn(id)) navStore.moveTo(dragId, id);
          setDragId(null);
          setOverId(null);
        }}
        onDragEnd={() => {
          setDragId(null);
          setOverId(null);
        }}
      >
        <div class="sp-nav-section">Pinned</div>
        {pinned.map((entry) => (
          <Row {...rowProps(entry)} />
        ))}
        {pinned.length === 0 && <div class="sp-nav-empty">Nothing pinned</div>}

        <div class="sp-nav-section">Jumps</div>
        {jumps.map((entry) => (
          <Row {...rowProps(entry)} />
        ))}
        {jumps.length === 0 && <div class="sp-nav-empty">No jumps</div>}
      </div>
    </div>
  );
}
