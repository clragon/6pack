import { createListStore, type ListItem } from '../../core/store';
import { seedRecords } from './seeds';

export type RecordCategory = 'positive' | 'neutral' | 'negative' | 'ban';

// A saved record template: the reason to lead with, plus the rules it quotes by
// default. The compositor assembles these into the record body.
export interface RecordTemplate extends ListItem {
  reason: string;
  // Rule keys; each renders as a quoted Code of Conduct section.
  rules: string[];
  // Presets the feedback category when applied; unset lets the mod pick.
  category?: RecordCategory;
  // Ban outcome, used when category is 'ban': duration in days (-1 permanent).
  duration?: number;
  preventLogin?: boolean;
}

export const recordStore = createListStore<RecordTemplate>(
  'sp.quick-feedbacks.records',
  seedRecords,
);
