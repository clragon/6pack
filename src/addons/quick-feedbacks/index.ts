import type { Action } from '../../core/actions/types';
import type { SixpackAddon } from '../../core/addons/types';
import { mountEmbed } from './embed';
import { openRecordsManager } from './manager';
import { banTarget, feedbackTarget } from './targets';

const onFeedbackForm = (): boolean =>
  /^\/user_feedbacks\/(new|\d+\/edit)$/.test(location.pathname);
const onBanForm = (): boolean => location.pathname === '/bans/new';
const onForm = (): boolean => onFeedbackForm() || onBanForm();

const manageRecords: Action = {
  id: 'feedbacks.manage',
  title: 'Manage quick feedbacks',
  description: 'Edit your record templates',
  keywords: [
    'manage',
    'edit',
    'template',
    'record',
    'feedback',
    'reason',
    'pin',
  ],
  when: onForm,
  run: () => openRecordsManager(),
};

export const quickFeedbacksAddon: SixpackAddon = {
  id: 'quick-feedbacks',
  name: 'Quick Feedbacks',
  description:
    'Composes user feedback records from reusable rules and reasons.',
  when: onForm,
  actions: [manageRecords],
  setup: (ctx) => {
    let teardown: (() => void) | undefined;
    ctx.whenReady(() => {
      teardown = mountEmbed(onBanForm() ? banTarget : feedbackTarget);
    });
    return () => teardown?.();
  },
};
