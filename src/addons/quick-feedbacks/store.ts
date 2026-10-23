import { readJson, writeJson } from '../../core/storage';
import { createListStore, type ListItem } from '../../core/store';
import { seedTemplates } from './seeds';

const KEY = 'sp.quick-feedbacks.templates';

export type FeedbackCategory = 'positive' | 'neutral' | 'negative' | 'ban';

export interface FeedbackTemplate extends ListItem {
  reason: string;
  rules: string[];
  category?: FeedbackCategory;
  duration?: number;
  preventLogin?: boolean;
}

const stored = readJson<FeedbackTemplate[] | null>(KEY, null);
if (stored?.some((template) => template.rules.includes('noteabuse')))
  writeJson(
    KEY,
    stored.map((template) => ({
      ...template,
      rules: template.rules.map((rule) =>
        rule === 'noteabuse' ? 'badnotes' : rule,
      ),
    })),
  );

export const templateStore = createListStore<FeedbackTemplate>(
  KEY,
  seedTemplates,
);
