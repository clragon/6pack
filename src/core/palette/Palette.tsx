import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import type { Action, ActionContext, SearchSuggestion } from '../actions/types';
import type { PageContext } from '../context/types';
import { log } from '../log';
import { notifyError } from '../../site/toast';
import { allChips, refreshChips, subscribeChips, type Chip } from './chips';
import { Breadcrumb, type Crumb } from './Breadcrumb';
import { focusNoScroll } from './focus';
import { captureNav, type Level, takeRestore } from './nav';
import { getFrecency, recordUse, scoreFor } from './frecency';
import { takePaletteTarget } from './store';
import { formatTrigger } from '../config';
import { searchActions } from './search';
import { WarningBanner } from './WarningBanner';

interface PaletteProps {
  open: boolean;
  page: PageContext;
  actions: Action[];
  onClose: () => void;
}

// What the list renders and Enter/Tab act on, unified across command levels and
// search levels.
interface Row {
  id: string;
  title: string;
  detail?: string;
  isGroup: boolean;
  inline?: boolean;
  color?: string;
  // Present on a toggle row: the switch's on/off state.
  toggle?: boolean;
  onSelect: () => void;
  onDrill?: () => void;
}

function describeError(error: unknown): string {
  return error instanceof Error
    ? (error.stack ?? error.message)
    : String(error);
}

function reportRunFailure(action: Action, error: unknown): void {
  log.error(`${action.id} failed: ${describeError(error)}`);
  notifyError("Couldn't complete that action");
}

export function Palette({ open, page, actions, onClose }: PaletteProps) {
  const [stack, setStack] = useState<Level[]>([{ actions }]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(0);
  const [frecency, setFrecency] = useState(getFrecency);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [, forceChips] = useState(0);
  // Bumped after a toggle runs so its switch reflects the new state in place.
  const [, forceRender] = useState(0);
  const activeChipRef = useRef<Chip | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLLIElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const childCache = useRef(new Map<string, Action[] | null>());

  const ctx: ActionContext = { page, close: onClose };
  const level = stack[stack.length - 1];
  const searchSpec = level.search;
  const levelActions = level.actions ?? [];
  const chips = open ? allChips() : [];
  const activeChipId = stack.find((l) => l.chipId)?.chipId ?? null;
  // Keep the active chip on screen even if its ticket dropped from the live list
  // while its menu is open.
  const displayChips =
    activeChipId &&
    !chips.some((c) => c.id === activeChipId) &&
    activeChipRef.current
      ? [...chips, activeChipRef.current]
      : chips;
  const activeChip = displayChips.find((c) => c.id === activeChipId) ?? null;
  // Chips show at the root, and stay (with the active one marked) while inside a
  // chip's own menu, never over an unrelated submenu.
  const showChips =
    displayChips.length > 0 && (stack.length === 1 || activeChipId != null);

  useEffect(() => {
    if (!open) return;
    childCache.current.clear();
    // Reopen where a dialog sent us back to, else at root. Keep a fresh root so
    // its predicates re-evaluate; reuse the captured deeper levels as-is. An
    // inline "open at" target instead drills straight into that group.
    const restore = takeRestore();
    const target = takePaletteTarget();
    let next: Level[] = restore
      ? [{ actions }, ...restore.slice(1)]
      : [{ actions }];
    if (target && !restore) {
      const group = actions.find((action) => action.id === target);
      try {
        const children = group?.submenu?.(ctx);
        if (group && children && !(children instanceof Promise)) {
          next = [
            { actions },
            {
              title: group.title,
              actions: children,
              placeholder: group.placeholder,
            },
          ];
        }
      } catch {
        // Fall back to root if the group's children can't resolve.
      }
    }
    setStack(next);
    setFilter('');
    setFrecency(getFrecency());
    requestAnimationFrame(() => focusNoScroll(inputRef.current));
  }, [open, actions]);

  // Ask volatile chip sources (open tickets in other tabs) to refresh on open,
  // and re-render as their state changes while open.
  useEffect(() => {
    if (!open) return;
    refreshChips();
    return subscribeChips(() => forceChips((n) => n + 1));
  }, [open]);

  // Lock the page scroll while open without moving content: snap the scroller
  // back to its captured position on any scroll. Layout-agnostic, and catches
  // both the focus-induced jump and background scrolling.
  // Lock background scroll while open without jitter: hide the scroller's
  // overflow so it can't scroll, compensate the scrollbar width to avoid a
  // layout shift, and pin the position in case overflow:hidden resets it.
  useEffect(() => {
    if (!open) return;
    const el = (document.scrollingElement ??
      document.documentElement) as HTMLElement;
    const top = el.scrollTop;
    const left = el.scrollLeft;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = el.style.overflow;
    const prevPadding = el.style.paddingRight;
    el.style.overflow = 'hidden';
    if (scrollbar > 0) el.style.paddingRight = `${scrollbar}px`;
    el.scrollTop = top;
    el.scrollLeft = left;
    return () => {
      el.style.overflow = prevOverflow;
      el.style.paddingRight = prevPadding;
      el.scrollTop = top;
      el.scrollLeft = left;
    };
  }, [open]);

  useEffect(() => {
    // Search levels start with nothing highlighted so Enter searches the query.
    setSelected(level.search ? -1 : 0);
  }, [filter, stack]);

  // Scroll only the list to keep the highlighted row visible, never the page.
  useEffect(() => {
    const el = selectedRef.current;
    const list = listRef.current;
    if (!el || !list) return;
    const elRect = el.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (elRect.top < listRect.top) {
      list.scrollTop -= listRect.top - elRect.top;
    } else if (elRect.bottom > listRect.bottom) {
      list.scrollTop += elRect.bottom - listRect.bottom;
    }
  }, [selected]);

  // Typing a prefix char at the root enters that action's search level.
  useEffect(() => {
    if (stack.length !== 1 || !filter) return;
    const action = levelActions.find(
      (a) => a.prefix && a.search && filter.startsWith(a.prefix),
    );
    if (action?.search) {
      const rest = filter.slice(action.prefix?.length ?? 0);
      setStack((s) => [...s, { title: action.title, search: action.search }]);
      setFilter(rest);
    }
  }, [filter, stack, levelActions]);

  // Debounced suggestions while in a search level.
  useEffect(() => {
    if (!searchSpec) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      void Promise.resolve(searchSpec.suggest(filter)).then((result) => {
        if (!cancelled) setSuggestions(result);
      });
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [searchSpec, filter]);

  const childrenOf = (action: Action): Action[] | null => {
    if (!action.submenu) return null;
    const cache = childCache.current;
    if (cache.has(action.id)) return cache.get(action.id) ?? null;
    // Resolving children is a load-time concern: if it throws, the feature can't
    // present itself, so fail silently (log only) rather than break the list.
    let value: Action[] | null;
    try {
      const result = action.submenu(ctx);
      value = result instanceof Promise ? null : result;
    } catch (error) {
      log.warn(`${action.id} submenu failed: ${describeError(error)}`);
      value = null;
    }
    cache.set(action.id, value);
    return value;
  };

  const reachableChildren = (action: Action): Action[] | null => {
    const children = childrenOf(action);
    return children ? children.filter((c) => !c.submenuOnly) : null;
  };

  const childTerms = (action: Action): string[] => {
    const children = reachableChildren(action);
    return children
      ? children.flatMap((c) => [c.title, ...(c.keywords ?? [])])
      : [];
  };

  const childMatchOf = (action: Action): Action | undefined => {
    const query = filter.trim();
    if (!query || !action.submenu) return undefined;
    const children = reachableChildren(action);
    if (!children || children.length === 0) return undefined;
    return searchActions(query, children)[0];
  };

  // The child a group resolves to without drilling: a query match, or a group's
  // single reachable leaf (drilling into a one-item menu is pointless). Shown as
  // "Group → Child" and run on select.
  const surfacedChild = (action: Action): Action | undefined => {
    const match = childMatchOf(action);
    if (match) return match;
    const children = reachableChildren(action);
    const only = children && children.length === 1 ? children[0] : undefined;
    return only && !only.submenu && !only.search ? only : undefined;
  };

  const filtered = useMemo(() => {
    const query = filter.trim();
    if (!query) {
      const now = Date.now();
      return levelActions
        .filter((action) => !action.hidden)
        .sort(
          (a, b) =>
            (b.weight ?? 0) - (a.weight ?? 0) ||
            scoreFor(frecency, b.id, now) - scoreFor(frecency, a.id, now),
        );
    }
    return searchActions(query, levelActions, childTerms).sort(
      (a, b) => (b.weight ?? 0) - (a.weight ?? 0),
    );
  }, [level, filter, frecency]);

  if (!open) return null;

  const runAction = (action: Action, viaGroup?: Action) => {
    setFrecency(recordUse(action.id));
    // Record the path to this action so a dialog it opens shows the full trail
    // and can navigate back. Reach-in (running a child without drilling) appends
    // the group's level so the trail still reads root > group > child.
    const navStack = viaGroup
      ? [
          ...stack,
          {
            title: viaGroup.title,
            actions: childrenOf(viaGroup) ?? [],
            placeholder: viaGroup.placeholder,
          },
        ]
      : stack;
    captureNav(navStack, action.title);
    // Safety net for active failures: a feature that can't function should log
    // the detail and toast generically, never throw into the palette. Actions
    // with their own try/catch return void here, so this won't double-report.
    try {
      const result = action.run?.(ctx);
      if (result instanceof Promise) {
        result.catch((error) => reportRunFailure(action, error));
      }
    } catch (error) {
      reportRunFailure(action, error);
    }
    onClose();
  };

  // Flip a toggle in place: run it, keep the palette open, and re-render so the
  // switch reflects the new state. No frecency/nav: a preference isn't a command.
  const toggleAction = (action: Action) => {
    try {
      action.run?.(ctx);
    } catch (error) {
      reportRunFailure(action, error);
    }
    forceRender((n) => n + 1);
  };

  const activateLeaf = (action: Action, viaGroup?: Action) => {
    if (action.checked) toggleAction(action);
    else runAction(action, viaGroup);
  };

  const drillInto = (action: Action, carryQuery: boolean) => {
    const children = childrenOf(action);
    if (!children) return;
    setStack((s) => [
      ...s,
      {
        title: action.title,
        actions: children,
        placeholder: action.placeholder,
      },
    ]);
    if (!carryQuery) setFilter('');
  };

  const enterSearch = (action: Action) => {
    setStack((s) => [...s, { title: action.title, search: action.search }]);
    setFilter('');
  };

  // Opening a chip shows its menu as a level under the root, tagged with the chip
  // id so the chip stays visible and marked active. Replacing (not stacking) lets
  // you switch between chips like browser tabs. Remembered so the active tab keeps
  // showing even if its ticket drops from the live list mid-menu.
  const openChip = (chip: Chip) => {
    activeChipRef.current = chip;
    setStack((s) => [
      s[0],
      { title: chip.label, actions: chip.open(ctx), chipId: chip.id },
    ]);
    setFilter('');
  };

  const popLevel = () => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    setFilter('');
  };

  const goHome = () => {
    setStack((s) => (s.length > 1 ? s.slice(0, 1) : s));
    setFilter('');
    requestAnimationFrame(() => focusNoScroll(inputRef.current));
  };

  const completeToken = (value: string) => {
    setFilter(filter.replace(/\S+$/, value) + ' ');
    requestAnimationFrame(() => focusNoScroll(inputRef.current));
  };

  const caretAtEnd = (): boolean => {
    const el = inputRef.current;
    return (
      !!el &&
      el.selectionStart === el.value.length &&
      el.selectionStart === el.selectionEnd
    );
  };

  let rows: Row[];
  if (searchSpec) {
    rows = suggestions.map((suggestion) => ({
      id: `sug:${suggestion.value}`,
      title: suggestion.label,
      detail: suggestion.detail,
      isGroup: false,
      inline: true,
      color: suggestion.category
        ? `var(--color-tag-${suggestion.category}, currentColor)`
        : undefined,
      onSelect: () => completeToken(suggestion.value),
    }));
  } else {
    rows = filtered.flatMap((action): Row[] => {
      if (action.search) {
        return [
          {
            id: action.id,
            title: action.title,
            detail: action.description,
            isGroup: false,
            onSelect: () => enterSearch(action),
          },
        ];
      }
      if (!action.submenu) {
        return [
          {
            id: action.id,
            title: action.title,
            detail: action.description,
            isGroup: false,
            toggle: action.checked?.(),
            onSelect: () => activateLeaf(action),
          },
        ];
      }
      const drill = () => drillInto(action, !!childMatchOf(action));
      const groupRow: Row = {
        id: action.id,
        title: action.title,
        detail: action.description,
        isGroup: true,
        onSelect: drill,
        onDrill: drill,
      };
      // Rows that reach into the group, shown as "Child" with a "from Group"
      // subtitle and run on Enter: the query's best match (so "type, Enter" runs
      // it) plus any child flagged `surface` (important enough to show at this
      // level), deduped. They sit above the group row, which drills into the full
      // filtered submenu.
      const childRow = (child: Action): Row => ({
        id: `${action.id}::${child.id}`,
        // Explicit title at the parent level; the submenu's short title otherwise.
        title: child.surfaceTitle ?? child.title,
        // The subtitle names the group it reaches into, for context and weight.
        detail: `from ${action.title}`,
        isGroup: false,
        toggle: child.checked?.(),
        onSelect: () => activateLeaf(child, action),
      });
      const match = childMatchOf(action);
      const shown = new Set<string>();
      const childRows: Row[] = [];
      if (match) {
        childRows.push(childRow(match));
        shown.add(match.id);
      }
      for (const child of reachableChildren(action) ?? []) {
        if (child.surface && !shown.has(child.id)) {
          childRows.push(childRow(child));
          shown.add(child.id);
        }
      }
      if (childRows.length > 0) return [...childRows, groupRow];
      // Nothing reached in: a single-leaf group surfaces its sole child (drilling
      // a one-item menu is pointless); otherwise a plain drill-in group.
      const single = surfacedChild(action);
      if (single) {
        return [
          {
            id: action.id,
            title: `${action.title} → ${single.title}`,
            detail: action.description,
            isGroup: true,
            onSelect: () => runAction(single, action),
            onDrill: drill,
          },
        ];
      }
      return [groupRow];
    });
  }

  const onKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();
    const current = rows[selected];
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected((s) => Math.min(s + 1, rows.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected((s) => Math.max(s - 1, searchSpec ? -1 : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (current) current.onSelect();
      else if (searchSpec) {
        searchSpec.onSubmit(filter);
        onClose();
      }
    } else if (event.key === 'Tab') {
      event.preventDefault();
      if (searchSpec) {
        const suggestion = suggestions[selected >= 0 ? selected : 0];
        if (suggestion) completeToken(suggestion.value);
      } else if (current?.onDrill) {
        current.onDrill();
      }
    } else if (event.key === 'ArrowRight') {
      if (caretAtEnd() && current?.onDrill) {
        event.preventDefault();
        current.onDrill();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (stack.length > 1) popLevel();
      else onClose();
    } else if (event.key === 'Backspace' && filter === '' && stack.length > 1) {
      event.preventDefault();
      popLevel();
    }
  };

  const drilled = stack.slice(1);
  const crumbs: Crumb[] = drilled.map((level, i) => ({
    label: level.title ?? '',
    // Every crumb but the current (trailing) one jumps back to that level.
    onClick:
      i < drilled.length - 1
        ? () => {
            setStack((s) => s.slice(0, i + 2));
            setFilter('');
          }
        : undefined,
  }));

  return (
    <div class="sp-backdrop" onClick={onClose}>
      <div class="sp-shell" onClick={(e) => e.stopPropagation()}>
        {showChips && (
          <div class="sp-chips">
            {displayChips.map((chip) => (
              <button
                key={chip.id}
                class={`sp-chip${chip.id === activeChipId ? ' sp-chip-active' : ''}`}
                onClick={() => openChip(chip)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
        <div class="sp-panel">
          <WarningBanner />
          <div class="sp-input-row">
            <Breadcrumb crumbs={crumbs} onHome={goHome} />
            <input
              ref={inputRef}
              class="sp-input"
              placeholder={
                searchSpec
                  ? (searchSpec.placeholder ?? 'Type to search…')
                  : stack.length === 1
                    ? `Type a command…  ·  ${formatTrigger()}`
                    : (level.placeholder ?? '')
              }
              value={filter}
              onInput={(e) => setFilter(e.currentTarget.value)}
              onKeyDown={onKeyDown}
            />
            {searchSpec && (
              <button
                class="sp-go"
                title="Search"
                onClick={() => {
                  searchSpec.onSubmit(filter);
                  onClose();
                }}
              >
                ›
              </button>
            )}
          </div>
          {activeChip?.info && activeChip.info.length > 0 && (
            <div class="sp-chip-info">
              {activeChip.info.map((fact) => (
                <span key={fact.label} class="sp-chip-fact">
                  <span class="sp-chip-fact-label">{fact.label}</span>
                  {fact.value}
                </span>
              ))}
            </div>
          )}
          <ul ref={listRef} class="sp-list">
            {rows.map((row, index) => (
              <li
                key={row.id}
                ref={index === selected ? selectedRef : undefined}
                class={`sp-item${row.inline ? ' sp-suggestion' : ''}${row.toggle !== undefined ? ' sp-item-toggle' : ''}${index === selected ? ' sp-selected' : ''}`}
                onMouseMove={() => {
                  if (selected !== index) setSelected(index);
                }}
                onClick={row.onSelect}
              >
                <span
                  class="sp-title"
                  style={row.color ? `color: ${row.color}` : undefined}
                >
                  {row.title}
                  {row.isGroup && <span class="sp-group-arrow"> ›</span>}
                </span>
                {row.detail && <span class="sp-desc">{row.detail}</span>}
                {row.toggle !== undefined && (
                  <span
                    class={`sp-switch${row.toggle ? ' sp-switch-on' : ''}`}
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
            {rows.length === 0 && (
              <li class="sp-empty">
                {searchSpec ? 'Type to search…' : 'No matching commands'}
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
