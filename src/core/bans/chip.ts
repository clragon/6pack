import type { Action } from '../actions/types';
import { registerChipSource, type Chip } from '../palette/chips';
import { openConfirm } from '../palette/confirm';
import { progress } from '../../site/toast';
import { navigateTo } from '../navigate';
import { readBanSubjectUser } from '../../site/ban';
import { createBan } from '../api/ban';
import { massBan, type MassBan } from './massBan';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const THROTTLE_MS = 500;

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

  const fire = progress(`Banning ${targets.length} users...`);
  let banned = 0;
  for (const id of targets) {
    try {
      await createBan(id, fields);
      banned += 1;
    } catch {
      // A failure shouldn't halt the rest; count only what landed.
    }
    fire.update(`Banning ${banned} of ${targets.length}...`);
    await delay(THROTTLE_MS);
  }
  fire.finish(`Banned ${banned} user${banned === 1 ? '' : 's'}.`);
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
    id: 'chip.massban',
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
