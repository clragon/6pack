import type { Action } from '../../core/actions/types';
import type { PageContext } from '../../core/context/types';
import { approveReplacement } from '../../core/api/replacements';
import { spawnConfirm } from '../../core/palette/spawnConfirm';
import { notify, notifyError } from '../../site/toast';

interface ApprovalTarget {
  id: number;
  penalize: boolean;
}

// The pending row carries the id and penalize flag e621's own Approve link posts,
// so read them straight off it. Absent when nothing is pending or the viewer
// can't approve (the link only renders then).
function firstPendingTarget(): ApprovalTarget | null {
  const link = document.querySelector<HTMLElement>(
    'tr.replacement-pending-row a.replacement-approve-action',
  );
  if (!link) return null;
  const id = Number(link.dataset.replacementId);
  if (!Number.isInteger(id)) return null;
  return { id, penalize: link.dataset.penalize === 'true' };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function runApprove(target: ApprovalTarget): Promise<void> {
  const ok = await spawnConfirm({
    title: `Approve replacement #${target.id}`,
    detail:
      'Replaces the post file. The replacement uploader becomes the post uploader.',
    confirmLabel: 'Approve',
  });
  if (!ok) return;
  try {
    await approveReplacement(target.id, target.penalize);
    notify(`Approved replacement #${target.id}`);
    window.location.reload();
  } catch (error) {
    notifyError(`Approve failed: ${describe(error)}`);
  }
}

function targetable(page: PageContext): boolean {
  return (
    page.kind === 'postReplacements' &&
    page.postId !== null &&
    firstPendingTarget() !== null
  );
}

export const approveReplacementAction: Action = {
  id: 'replacement.approve',
  title: 'Approve replacement',
  description: 'Accept the pending replacement on this post',
  keywords: ['approve', 'replacement', 'accept'],
  weight: 2,
  when: (page) => targetable(page),
  run: () => {
    const target = firstPendingTarget();
    if (target) void runApprove(target);
    else notifyError('No pending replacement to approve');
  },
};
