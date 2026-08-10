import {
  createListStore,
  type ListItem,
  type ListStore,
} from '../../core/store';

export interface Template extends ListItem {
  body: string;
}

export type ReplyStore = ListStore<Template>;

export function createStore(key: string, seed: () => Template[]): ReplyStore {
  return createListStore<Template>(key, seed);
}
