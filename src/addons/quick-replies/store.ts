import {
  createListStore,
  type ListItem,
  type ListStore,
} from '../../core/store';

// A saved reply. The same shape backs every context (ticket, appeal, dmail); each
// context keeps its own list under its own key.
export interface Template extends ListItem {
  body: string;
}

export type ReplyStore = ListStore<Template>;

export function createStore(key: string, seed: () => Template[]): ReplyStore {
  return createListStore<Template>(key, seed);
}
