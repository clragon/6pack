import type { Action } from '../../core/actions/types';
import { undeletePost, unapprovePost } from '../../core/api/posts';
import { openConfirm } from '../../core/palette/confirm';
import { isApprovalsEnabled } from '../../site/approval';
import { isDeleted, readCreatedAt } from '../../site/post';
import { notify, notifyError } from '../../site/toast';

// e621ng's unapproved_post_deletion_window in
// config/danbooru_default_config.rb.
const UNAPPROVE_WINDOW_DAYS = 30;

function withinUnapproveWindow(): boolean {
  const created = readCreatedAt();
  if (!created) return false;
  return (Date.now() - created.getTime()) / 86_400_000 < UNAPPROVE_WINDOW_DAYS;
}

async function runUndelete(id: number): Promise<void> {
  const confirmed = await openConfirm({
    title: `Undelete post #${id}`,
    detail: 'Approves the post under your name.',
    confirmLabel: 'Undelete',
  });
  if (!confirmed) return;
  try {
    await undeletePost(id);
    notify(`Undeleted post #${id}`);
    window.location.reload();
  } catch (error) {
    notifyError(
      `Undelete failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function runUndeleteAndUnapprove(id: number): Promise<void> {
  const confirmed = await openConfirm({
    title: `Undelete and unapprove post #${id}`,
    detail: 'Restores the post to pending.',
    confirmLabel: 'Undelete',
  });
  if (!confirmed) return;
  try {
    await undeletePost(id);
    await unapprovePost(id);
    notify(`Undeleted and unapproved post #${id}`);
    window.location.reload();
  } catch (error) {
    notifyError(
      `Undelete/unapprove failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const undelete: Action = {
  id: 'post.undelete',
  title: 'Undelete',
  description: 'Restore this post (approves it under your name)',
  keywords: ['undelete', 'restore', 'recover'],
  weight: 1,
  when: (page) => page.kind === 'post' && isApprovalsEnabled() && isDeleted(),
  run: ({ page }) => {
    if (page.kind === 'post') void runUndelete(page.id);
  },
};

export const undeleteAndUnapprove: Action = {
  id: 'post.undelete-unapprove',
  title: 'Undelete and unapprove',
  description: 'Restore without approving it (sends back to pending)',
  keywords: ['undelete', 'unapprove', 'restore', 'pending', 'recover'],
  weight: 2,
  when: (page) =>
    page.kind === 'post' &&
    isApprovalsEnabled() &&
    isDeleted() &&
    withinUnapproveWindow(),
  run: ({ page }) => {
    if (page.kind === 'post') void runUndeleteAndUnapprove(page.id);
  },
};
