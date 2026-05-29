import type { PageContext } from '../context/types';

export interface ActionContext {
  page: PageContext;
  close: () => void;
}

export interface Action {
  // frecency.ts in core/palette keys an action's ranking by this id, so a
  // rename drops the ranking.
  id: string;
  title: string;
  description?: string;
  keywords?: string[];
  when?: (page: PageContext) => boolean;
  hidden?: boolean;
  weight?: number;
  submenuOnly?: boolean;
  run?: (ctx: ActionContext) => void | Promise<void>;
  submenu?: (ctx: ActionContext) => Action[] | Promise<Action[]>;
  prefix?: string;
  search?: SearchSpec;
}

export interface SearchSuggestion {
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
