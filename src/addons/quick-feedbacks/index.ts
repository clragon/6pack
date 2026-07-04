import type { Action } from '../../core/actions/types';
import type { SixpackAddon } from '../../core/addons/types';
import { mountEmbed } from './embed';
import { openRecordsManager } from './manager';

const onFeedbackForm = (): boolean =>
  /^\/user_feedbacks\/(new|\d+\/edit)$/.test(location.pathname);

const manageRecords: Action = {
  id: 'feedbacks.manage',
  title: 'Manage quick feedbacks',
  description: 'Edit your record templates',
  keywords: ['manage', 'edit', 'template', 'record', 'feedback', 'reason', 'pin'],
  when: onFeedbackForm,
  run: () => openRecordsManager(),
};

export const quickFeedbacksAddon: SixpackAddon = {
  id: 'quick-feedbacks',
  name: 'Quick Feedbacks',
  when: onFeedbackForm,
  actions: [manageRecords],
  setup: (ctx) => {
    let teardown: (() => void) | undefined;
    ctx.whenReady(() => {
      teardown = mountEmbed();
    });
    return () => teardown?.();
  },
};
