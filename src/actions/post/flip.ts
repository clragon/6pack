import type { Action } from '../../core/actions/types';
import { setParent } from '../../core/api/posts';
import { openConfirm } from '../../core/palette/confirm';
import { isApprovalsEnabled } from '../../site/approval';
import { readChildIds } from '../../site/post';
import { notify, notifyError } from '../../site/toast';

async function runFlip(id: number): Promise<void> {
  const children = readChildIds();
  if (children.length === 0) return;

  let target: number;
  if (children.length === 1) {
    // Unambiguous: execute instantly, no prompt.
    target = children[0];
  } else {
    const result = await openConfirm({
      title: `Flip parent/child for post #${id}`,
      detail: `Children: ${children.map((child) => `#${child}`).join(', ')}`,
      confirmLabel: 'Flip',
      fields: [
        {
          key: 'target',
          label: 'Make this post a child of #',
          numeric: true,
          placeholder: 'child post #',
        },
      ],
    });
    if (!result) return;
    target = Number(result.fields.target.trim());
  }

  try {
    await setParent(id, target);
    notify(`#${id} is now a child of #${target}`);
    window.location.reload();
  } catch (error) {
    notifyError(
      `Flip failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const flipRelationship: Action = {
  id: 'post.flip-relationship',
  title: 'Flip parent/child',
  description: "Make one of this post's children its parent",
  keywords: ['flip', 'parent', 'child', 'swap', 'relationship', 'reparent'],
  weight: 1,
  when: (page) =>
    page.kind === 'post' && isApprovalsEnabled() && readChildIds().length > 0,
  run: ({ page }) => {
    if (page.kind === 'post') void runFlip(page.id);
  },
};
