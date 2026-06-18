import type { PageContext } from '../context/types';

export interface ActionContext {
  page: PageContext;
  close: () => void;
}

export interface Action {
  id: string;
  title: string;
  description?: string;
  keywords?: string[];
  // Gate visibility on the current page. Absent means always available.
  when?: (page: PageContext) => boolean;
  // Omit from the list when the search box is empty; still surfaces when matched.
  hidden?: boolean;
  // Ranking bias: positive floats up, negative sinks. Default 0.
  weight?: number;
  // Excluded from the parent group's reach-in: reachable only by drilling into
  // the submenu, never surfaced or pre-selected from the parent level.
  submenuOnly?: boolean;
  // A submenu child that also appears at the parent level (run directly), while
  // still living in the submenu. The parent-level row is deduped against a query
  // reach-in for the same child.
  surface?: boolean;
  // The explicit title used when this child is shown at the parent level
  // (surfaced or reached into via search), where the submenu's context is absent.
  // The short `title` still applies inside the submenu. Falls back to `title`.
  surfaceTitle?: string;
  // Leaf behaviour. A group (one with `submenu`) may omit this.
  run?: (ctx: ActionContext) => void | Promise<void>;
  // Marks a toggle: its current on/off state. When present the row shows a switch
  // reflecting this, and activating runs `run` in place (the palette stays open
  // and the switch flips) instead of closing like a normal command.
  checked?: () => boolean;
  // Makes this a group: resolves child actions lazily when needed. Children may
  // be a Promise (e.g. an API call); sync children additionally enable query
  // reach-in, matching and pre-selecting a child from the parent list.
  submenu?: (ctx: ActionContext) => Action[] | Promise<Action[]>;
  // Placeholder for the input once this group's submenu level is open. Omit for
  // none: submenus filter a list, they aren't "type a command" like the root.
  placeholder?: string;
  // Prefix-search. Typing this char at the root, or selecting the action, opens
  // the action's search level: an autocomplete-driven query box.
  prefix?: string;
  search?: SearchSpec;
}

export interface SearchSuggestion {
  // Replaces the active token in the query when chosen.
  value: string;
  label: string;
  detail?: string;
  category?: string;
}

export interface SearchSpec {
  placeholder?: string;
  suggest: (query: string) => SearchSuggestion[] | Promise<SearchSuggestion[]>;
  onSubmit: (query: string) => void;
}
