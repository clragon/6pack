import { createListStore, type ListItem } from '../../core/store';
import { seedRecords } from './seeds';

export type RecordCategory = 'positive' | 'neutral' | 'negative' | 'ban';

export interface RecordTemplate extends ListItem {
  reason: string;
  rules: string[];
  category?: RecordCategory;
  duration?: number;
  preventLogin?: boolean;
}

export const recordStore = createListStore<RecordTemplate>(
  'sp.quick-feedbacks.records',
  seedRecords,
);
