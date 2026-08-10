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
  secret?: boolean;
  weight?: number;
  submenuOnly?: boolean;
  surface?: boolean;
  surfaceTitle?: string;
  drillOnly?: boolean;
  run?: (ctx: ActionContext) => void | Promise<void>;
  checked?: () => boolean;
  submenu?: (ctx: ActionContext) => Action[] | Promise<Action[]>;
  placeholder?: string;
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
