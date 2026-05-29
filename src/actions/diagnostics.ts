import type { Action } from '../core/actions/types';
import { log } from '../core/log';
import { isApprovalMode, isApprovalsEnabled, readRawMode } from '../site/approval';
import {
  isDeleted,
  readArtistTags,
  readParentId,
  readUploaderId,
} from '../site/post';
import { canApprovePosts, currentUserId, currentUserName } from '../site/user';

// Hidden until searched ("diag"/"debug"). Drilling in shows a fresh snapshot of
// every site signal plus recent log lines; each row copies its text.
export const diagnostics: Action = {
  id: 'diagnostics',
  title: 'Diagnostics',
  description: 'Current site-signal values, for debugging',
  keywords: ['diagnostics', 'debug', 'signals', 'health', 'status', 'logs'],
  hidden: true,
  weight: -5,
  submenu: ({ page }) => {
    const rows: string[] = [
      `user: ${currentUserName() ?? '?'} #${currentUserId() ?? '?'}`,
      `can approve: ${canApprovePosts()}`,
      `approvals on (jtb): ${isApprovalsEnabled()}`,
      `approve mode (menu): ${isApprovalMode()}`,
      `mode (raw): ${JSON.stringify(readRawMode())}`,
      `page: ${page.kind === 'post' ? `post #${page.id}` : page.kind}`,
    ];
    if (page.kind === 'post') {
      rows.push(`deleted: ${isDeleted()}`);
      rows.push(`uploader id: ${readUploaderId()}`);
      rows.push(`parent id: ${readParentId()}`);
      rows.push(`artist tags: ${readArtistTags().length}`);
    }
    for (const entry of log.entries().slice(-10).reverse()) {
      rows.push(`log [${entry.level}] ${entry.message}`);
    }

    return rows.map((text, index) => ({
      id: `diagnostics.row.${index}`,
      title: text,
      keywords: [text],
      submenuOnly: true,
      run: () => {
        void navigator.clipboard.writeText(text);
      },
    }));
  },
};
