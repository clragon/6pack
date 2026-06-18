import type { Action } from '../../core/actions/types';
import { deletePost } from '../../core/api/posts';
import { openConfirm } from '../../core/palette/confirm';
import { isApprovalsEnabled } from '../../site/approval';
import { isDeleted, readParentId } from '../../site/post';
import { notify, notifyError } from '../../site/toast';
import { DELETE_REASONS, type DeleteReason } from './deleteReasons';

async function runDelete(id: number, choice: DeleteReason): Promise<void> {
  const parentId = readParentId();

  const fields = choice.needsId
    ? [
        {
          key: 'ref',
          label: 'Reference post #',
          numeric: true,
          value: parentId != null ? String(parentId) : '',
          placeholder: 'e.g. 123456',
        },
      ]
    : [];

  const options =
    parentId != null
      ? [
          {
            key: 'moveFavorites',
            label: `Move favorites to parent #${parentId}`,
            default: choice.needsId,
          },
          { key: 'copyTags', label: `Merge tags into parent #${parentId}` },
          {
            key: 'copySources',
            label: `Merge sources into parent #${parentId}`,
          },
        ]
      : [];

  const result = await openConfirm({
    title: `Delete post #${id}`,
    detail: `Reason: ${choice.reason}${choice.needsId ? '…' : ''}`,
    confirmLabel: 'Delete',
    fields,
    options,
  });
  if (!result) return;

  const reason = choice.needsId
    ? `${choice.reason}${result.fields.ref.trim()}`
    : choice.reason;

  try {
    await deletePost(id, {
      reason,
      moveFavorites: result.options.moveFavorites,
      copyTags: result.options.copyTags,
      copySources: result.options.copySources,
    });
    notify(`Deleted post #${id}`);
    window.location.reload();
  } catch (error) {
    notifyError(
      `Delete failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const deletePostGroup: Action = {
  id: 'post.delete',
  title: 'Delete',
  description: 'Delete this post with a reason',
  keywords: ['delete', 'remove', 'reject', 'dnmqs'],
  weight: 1,
  when: (page) => page.kind === 'post' && isApprovalsEnabled() && !isDeleted(),
  submenu: ({ page }) => {
    if (page.kind !== 'post') return [];
    const id = page.id;
    return DELETE_REASONS.map((choice) => ({
      id: `post.delete.${choice.label}`,
      title: choice.label,
      keywords: choice.keywords,
      run: () => {
        void runDelete(id, choice);
      },
    }));
  },
};
