import type { Action } from '../../core/actions/types';
import { registerChipSource, type Chip } from '../../core/palette/chips';
import { openConfirm } from '../../core/palette/confirm';
import { navigateTo } from '../../core/navigate';
import { readBanSubjectUser } from '../../site/ban';
import { enqueue } from './queue';
import { massBan, type MassBan } from './massBan';

async function banOthers(fields: Record<string, string>, exclude: number) {
  const template = massBan.get();
  if (!template) return;
  const targets = template.userIds.filter((id) => id !== exclude);
  if (targets.length === 0) return;
  const ok = await openConfirm({
    title: `Ban ${targets.length} other user${targets.length === 1 ? '' : 's'} with this template?`,
    confirmLabel: 'Ban',
  });
  if (!ok) return;

  enqueue({
    type: 'user',
    fields,
    targets: targets.map((id) => ({
      id: String(id),
      status: 'pending' as const,
    })),
  });
  massBan.clear();
}

function actions(template: MassBan): Action[] {
  const result: Action[] = [];
  const subject = readBanSubjectUser();

  if (template.fields && subject) {
    const others = template.userIds.filter((id) => id !== subject.id).length;
    if (others > 0) {
      const fields = template.fields;
      result.push({
        id: 'massban.others',
        title: `Ban ${others} other user${others === 1 ? '' : 's'} with this template`,
        keywords: ['ban', 'mass', 'template', 'others', 'bulk'],
        run: ({ close }) => {
          close();
          void banOthers(fields, subject.id);
        },
      });
    }
  } else if (!template.fields) {
    result.push({
      id: 'massban.form',
      title: 'Open the ban form',
      keywords: ['ban', 'form', 'open', 'template'],
      run: () => navigateTo(`/bans/new?ban[user_id]=${template.userIds[0]}`),
    });
  }

  result.push({
    id: 'massban.abort',
    title: 'Abort ban template',
    keywords: ['abort', 'cancel', 'clear', 'ban', 'template'],
    run: () => massBan.clear(),
  });
  return result;
}

function toChip(template: MassBan): Chip {
  return {
    id: 'massban',
    label: `Ban template (${template.userIds.length})`,
    open: () => actions(template),
  };
}

export function installMassBanChip(): void {
  registerChipSource({
    list: () => {
      const template = massBan.get();
      return template ? [toChip(template)] : [];
    },
    subscribe: massBan.subscribe,
  });
}
