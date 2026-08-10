import { navigateTo } from '../../core/navigate';
import { assembleRecord } from './compositor';
import { recordRuleUse } from './ruleFrecency';
import type { FeedbackTemplate } from './store';

interface PickApi {
  setReason: (reason: string) => void;
  setActive: (rules: string[]) => void;
}

// A form the embed drives: the reason field it composes into, the label above the
// rendered preview, and what picking a template does to the page's own controls.
export interface EmbedTarget {
  field: string;
  outputLabel: string;
  pick: (template: FeedbackTemplate, api: PickApi) => void;
}

function redirectToBan(template: FeedbackTemplate): void {
  const userName =
    document.querySelector<HTMLInputElement>(
      'input[name="user_feedback[user_name]"]',
    )?.value ?? '';
  const params = new URLSearchParams();
  if (userName) params.set('ban[user_name]', userName);
  params.set(
    'ban[reason]',
    assembleRecord({
      reason: template.reason,
      rules: template.rules,
      sources: [],
    }),
  );
  if (template.duration != null)
    params.set('ban[duration]', String(template.duration));
  if (template.preventLogin) params.set('ban[prevent_login]', '1');
  navigateTo(`/bans/new?${params}`);
}

export const feedbackTarget: EmbedTarget = {
  field: "textarea[name='user_feedback[body]']",
  outputLabel: 'Record',
  pick(template, { setReason, setActive }) {
    // A ban here is a jump to the ban form, prefilled from the template.
    if (template.category === 'ban') {
      redirectToBan(template);
      return;
    }
    setReason(template.reason);
    setActive([...template.rules]);
    recordRuleUse(template.rules);
    if (template.category)
      document
        .querySelector<HTMLInputElement>(
          `input[name="user_feedback[category]"][value="${template.category}"]`,
        )
        ?.click();
  },
};

// Drives the duration through e621's preset radios, which copy the value into the
// hidden ban[duration] field, and a value off the presets goes through Custom.
function setBanDuration(days: number): void {
  const preset = document.querySelector<HTMLInputElement>(
    `input[name='ban_preset'][value='${days}']`,
  );
  if (preset) {
    preset.checked = true;
    preset.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }
  const custom = document.querySelector<HTMLInputElement>(
    '#ban_duration_preset_custom',
  );
  if (custom) {
    custom.checked = true;
    custom.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const field = document.querySelector<HTMLInputElement>(
    '#ban_duration_custom_input',
  );
  if (field) {
    field.value = String(days);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function setBanPreventLogin(on: boolean): void {
  const box = document.querySelector<HTMLInputElement>(
    "input[name='ban[prevent_login]'][type='checkbox']",
  );
  if (box && box.checked !== on) {
    box.checked = on;
    box.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

export const banTarget: EmbedTarget = {
  field: "textarea[name='ban[reason]']",
  outputLabel: 'Reason',
  pick(template, { setReason, setActive }) {
    // Every template seeds the ban reason, and a ban template also sets the
    // terms, so a plain record can be upgraded to a ban in place.
    setReason(template.reason);
    setActive([...template.rules]);
    recordRuleUse(template.rules);
    if (template.category === 'ban') {
      if (template.duration != null) setBanDuration(template.duration);
      if (template.preventLogin) setBanPreventLogin(true);
    }
  },
};
