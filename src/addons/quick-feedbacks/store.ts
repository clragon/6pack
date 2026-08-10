import { createListStore, type ListItem } from '../../core/store';
import { seedTemplates } from './seeds';

export type FeedbackCategory = 'positive' | 'neutral' | 'negative' | 'ban';

// A saved feedback template: the reason to lead with, plus the rules it quotes by
// default. The compositor assembles these into the record body.
export interface FeedbackTemplate extends ListItem {
  reason: string;
  // Rule keys; each renders as a quoted Code of Conduct section.
  rules: string[];
  // Presets the feedback category when applied; unset lets the mod pick.
  category?: FeedbackCategory;
  // Ban outcome, used when category is 'ban': duration in days (-1 permanent).
  duration?: number;
  preventLogin?: boolean;
}

export const templateStore = createListStore<FeedbackTemplate>(
  'sp.quick-feedbacks.templates',
  seedTemplates,
);
