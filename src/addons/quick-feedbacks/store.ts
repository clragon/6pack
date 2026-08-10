import { createListStore, type ListItem } from '../../core/store';
import { seedTemplates } from './seeds';

export type FeedbackCategory = 'positive' | 'neutral' | 'negative' | 'ban';

export interface FeedbackTemplate extends ListItem {
  reason: string;
  rules: string[];
  category?: FeedbackCategory;
  duration?: number;
  preventLogin?: boolean;
}

export const templateStore = createListStore<FeedbackTemplate>(
  'sp.quick-feedbacks.templates',
  seedTemplates,
);
