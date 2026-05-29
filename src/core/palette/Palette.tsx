import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import type {
  Action,
  ActionContext,
  SearchSuggestion,
} from '../actions/types';
import type { PageContext } from '../context/types';
import { log } from '../log';
import { notifyError } from '../../site/toast';
import { Breadcrumb, type Crumb } from './Breadcrumb';
import { focusNoScroll } from './focus';
import { captureNav, type Level, takeRestore } from './nav';
import { getRecency, recordRecency } from './recency';
import { searchActions } from './search';
import { WarningBanner } from './WarningBanner';

interface PaletteProps {
  open: boolean;
  page: PageContext;
  actions: Action[];
  onClose: () => void;
}

interface Row {
  id: string;
  title: string;
  detail?: string;
  isGroup: boolean;
  inline?: boolean;
  color?: string;
  onSelect: () => void;
  onDrill?: () => void;
}

function describeError(error: unknown): string {
  return error instanceof Error ? (error.stack ?? error.message) : String(error);
}

function reportRunFailure(action: Action, error: unknown): void {
  log.error(`${action.id} failed: ${describeError(error)}`);
  notifyError("Couldn't complete that action");
}

export function Palette({ open, page, actions, onClose }: PaletteProps) {
  const [stack, setStack] = useState<Level[]>([{ actions }]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(0);
  const [recency, setRecency] = useState<Record<string, number>>(getRecency);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLLIElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const childCache = useRef(new Map<string, Action[] | null>());

  const ctx: ActionContext = { page, close: onClose };
  const level = stack[stack.length - 1];
  const searchSpec = level.search;
  const levelActions = level.actions ?? [];

  useEffect(() => {
    if (!open) return;
    const restore = takeRestore();
    setStack(restore ? [{ actions }, ...restore.slice(1)] : [{ actions }]);
    setFilter('');
    setRecency(getRecency());
    childCache.current.clear();
    requestAnimationFrame(() => focusNoScroll(inputRef.current));
  }, [open, actions]);

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
    setSelected(level.search ? -1 : 0);
  }, [filter, stack]);

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
    return children ? children.flatMap((c) => [c.title, ...(c.keywords ?? [])]) : [];
  };

  const childMatchOf = (action: Action): Action | undefined => {
    const query = filter.trim();
    if (!query || !action.submenu) return undefined;
    const children = reachableChildren(action);
    if (!children || children.length === 0) return undefined;
    return searchActions(query, children)[0];
  };

  const filtered = useMemo(() => {
    const query = filter.trim();
    if (!query) {
      return levelActions
        .filter((action) => !action.hidden)
        .sort(
          (a, b) =>
            (b.weight ?? 0) - (a.weight ?? 0) ||
            (recency[b.id] ?? 0) - (recency[a.id] ?? 0),
        );
    }
    return searchActions(query, levelActions, childTerms).sort(
      (a, b) => (b.weight ?? 0) - (a.weight ?? 0),
    );
  }, [level, filter, recency]);

  if (!open) return null;

  const runAction = (action: Action, viaGroup?: Action) => {
    setRecency(recordRecency(action.id));
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

  const drillInto = (action: Action, carryQuery: boolean) => {
    const children = childrenOf(action);
    if (!children) return;
    setStack((s) => [
      ...s,
      { title: action.title, actions: children, placeholder: action.placeholder },
    ]);
    if (!carryQuery) setFilter('');
  };

  const enterSearch = (action: Action) => {
    setStack((s) => [...s, { title: action.title, search: action.search }]);
    setFilter('');
  };

  const activate = (action: Action) => {
    if (action.search) return enterSearch(action);
    const match = childMatchOf(action);
    if (match) runAction(match, action);
    else if (action.submenu) drillInto(action, false);
    else runAction(action);
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
    rows = filtered.map((action) => {
      const match = childMatchOf(action);
      const isGroup = !!action.submenu;
      return {
        id: action.id,
        title: isGroup && match ? `${action.title} → ${match.title}` : action.title,
        detail: action.description,
        isGroup,
        onSelect: () => activate(action),
        onDrill: isGroup ? () => drillInto(action, !!match) : undefined,
      };
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
      <div class="sp-panel" onClick={(e) => e.stopPropagation()}>
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
                  ? 'Type a command…'
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
        <ul ref={listRef} class="sp-list">
          {rows.map((row, index) => (
            <li
              key={row.id}
              ref={index === selected ? selectedRef : undefined}
              class={`sp-item${row.inline ? ' sp-suggestion' : ''}${index === selected ? ' sp-selected' : ''}`}
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
  );
}
