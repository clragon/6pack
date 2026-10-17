import type { Action } from '../../core/actions/types';
import type { SixpackAddon } from '../../core/addons/types';
import { mountEmbed } from './embed';
import { openTemplateManager } from './manager';
import { banTarget, feedbackTarget } from './targets';

const onFeedbackForm = (): boolean =>
  /^\/user_feedbacks\/(new|\d+\/edit)$/.test(location.pathname);
const onBanForm = (): boolean => location.pathname === '/bans/new';
const onForm = (): boolean => onFeedbackForm() || onBanForm();

const manageTemplates: Action = {
  id: 'feedback.templates.manage',
  title: 'Manage quick feedbacks',
  description: 'Edit your feedback templates',
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
  run: () => openTemplateManager(),
};

export const quickFeedbacksAddon: SixpackAddon = {
  id: 'quick-feedbacks',
  name: 'Quick Feedbacks',
  description:
    'Writes feedbacks and bans from saved reasons, with the matching rules quoted from the Code of Conduct.',
  when: onForm,
  actions: [manageTemplates],
  setup: (ctx) => {
    let teardown: (() => void) | undefined;
    ctx.whenReady(() => {
      teardown = mountEmbed(onBanForm() ? banTarget : feedbackTarget);
    });
    return () => teardown?.();
  },
};
