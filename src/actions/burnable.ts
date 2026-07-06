import type { Action } from '../core/actions/types';
import { burnPile, type BurnRef } from '../core/burn';
import { resourceName } from '../core/resource';
import { massBan } from '../core/bans/massBan';
import { navigateTo } from '../core/navigate';
import { openConfirm } from '../core/palette/confirm';
import { enqueue } from '../core/jobs/queue';
import { notify } from '../site/toast';

async function incinerate(items: BurnRef[], markType?: string): Promise<void> {
  const total = items.length;
  if (total === 0) return;
  const marked = markType ? ` and mark for ${markType}` : '';
  const confirmed = await openConfirm({
    title: `Incinerate ${total} item${total === 1 ? '' : 's'}${marked}?`,
    confirmLabel: 'Incinerate',
  });
  if (!confirmed) return;

  const byType = new Map<BurnRef['type'], string[]>();
  for (const item of items) {
    const ids = byType.get(item.type) ?? [];
    ids.push(item.id);
    byType.set(item.type, ids);
  }
  for (const [type, ids] of byType) {
    enqueue({
      type,
      markType,
      targets: ids.map((id) => ({ id, status: 'pending' as const })),
    });
  }
  burnPile.clear();
}

function copyLinks(items: BurnRef[]): void {
  const first = items[0];
  if (!first) return;
  const byType: Partial<Record<BurnRef['type'], string[]>> = {};
  for (const item of items) (byType[item.type] ??= []).push(item.id);
  const url = (type: BurnRef['type'], ids: string[]) =>
    type === 'comment'
      ? `https://e621.net/comments?group_by=comment&search[id]=${ids.join(',')}`
      : `https://e621.net/forum_posts?search[id]=${ids.join(',')}`;
  const text = Object.entries(byType)
    .map(([type, ids]) => url(type as BurnRef['type'], ids ?? []))
    .join('\n');
  void navigator.clipboard.writeText(text);
  const noun = resourceName(first.type, items.length);
  notify(`Copied a link to ${items.length} ${noun}`);
}

export const burnable: Action = {
  id: 'burnable',
  title: 'Burnable',
  description: 'Act on the burn pile',
  keywords: [
    'burnable',
    'burn',
    'incinerate',
    'selected',
    'selection',
    'mass',
    'bulk',
    'pile',
    'hide',
  ],
  weight: 2,
  when: () => burnPile.count() > 0,
  submenu: () => {
    const items = burnPile.items();
    if (items.every((item) => item.type === 'user')) {
      return [
        {
          id: 'burnable.ban',
          title: `Ban ${items.length} selected user${items.length === 1 ? '' : 's'}`,
          keywords: ['ban', 'mass', 'users', 'bulk', 'template'],
          run: () => {
            const ids = items
              .map((item) => Number(item.id))
              .filter(Number.isFinite);
            if (ids.length === 0) return;
            massBan.start(ids);
            navigateTo(`/bans/new?ban[user_id]=${ids[0]}`);
          },
        },
        {
          id: 'burnable.clear',
          title: 'Clear pile',
          keywords: ['clear', 'deselect', 'reset', 'empty'],
          run: () => burnPile.clear(),
        },
      ];
    }
    const burn = (markType: string | undefined, title: string): Action => ({
      id: `burnable.incinerate.${markType ?? 'plain'}`,
      title,
      keywords: ['incinerate', 'burn', 'hide', ...(markType ? [markType] : [])],
      run: () => void incinerate(items, markType),
    });
    return [
      burn(undefined, `Incinerate (${items.length})`),
      burn('warning', 'Incinerate and mark for warning'),
      burn('record', 'Incinerate and mark for record'),
      burn('ban', 'Incinerate and mark for ban'),
      {
        id: 'burnable.copy',
        title: 'Copy links',
        keywords: ['copy', 'links', 'urls', 'clipboard'],
        run: () => copyLinks(items),
      },
      {
        id: 'burnable.clear',
        title: 'Clear pile',
        keywords: ['clear', 'deselect', 'reset', 'empty'],
        run: () => burnPile.clear(),
      },
    ];
  },
};
