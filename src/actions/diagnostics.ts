import type { Action } from '../core/actions/types';
import { isApprovalMode, isApprovalsEnabled, readRawMode } from '../site/approval';
import {
  isDeleted,
  readArtistTags,
  readParentId,
  readUploaderId,
} from '../site/post';
import { readReportedContent, readTicketParties, type TicketUser } from '../site/ticket';
import {
  canApprovePosts,
  currentUser,
  currentUserId,
  currentUserName,
  isAdmin,
  isJanitorPlus,
  isModeratorPlus,
  loadCurrentUser,
} from '../site/user';

function describeUser(user: TicketUser | null): string {
  return user ? `${user.name} #${user.id}` : '-';
}

export const diagnostics: Action = {
  id: 'diagnostics',
  title: 'Diagnostics',
  description: 'Current site-signal values, for debugging',
  keywords: ['diagnostics', 'debug', 'signals', 'health', 'status'],
  hidden: true,
  weight: -5,
  submenu: ({ page }) => {
    void loadCurrentUser();
    const user = currentUser();
    const rows: string[] = [
      `user: ${currentUserName() ?? '?'} #${currentUserId() ?? '?'}`,
      `level: ${user ? `${user.levelString || '?'} (${user.level})` : '(not loaded)'}`,
      `gates: janitor=${isJanitorPlus()} mod=${isModeratorPlus()} admin=${isAdmin()}`,
      `can approve: ${canApprovePosts()}`,
      `approvals on (jtb): ${isApprovalsEnabled()}`,
      `approve mode (menu): ${isApprovalMode()}`,
      `mode (raw): ${JSON.stringify(readRawMode())}`,
      `page: ${
        page.kind === 'post'
          ? `post #${page.id}`
          : page.kind === 'ticket'
            ? `ticket #${page.id}`
            : page.kind
      }`,
    ];
    if (page.kind === 'post') {
      rows.push(`deleted: ${isDeleted()}`);
      rows.push(`uploader id: ${readUploaderId()}`);
      rows.push(`parent id: ${readParentId()}`);
      rows.push(`artist tags: ${readArtistTags().length}`);
    }
    if (page.kind === 'ticket') {
      const parties = readTicketParties();
      rows.push(`reporter: ${describeUser(parties.reporter)}`);
      rows.push(`accused: ${describeUser(parties.accused)}`);
      rows.push(`handler: ${describeUser(parties.handler)}`);
      rows.push(`claimant: ${describeUser(parties.claimant)}`);
      const content = readReportedContent();
      const reported = content
        ? `${content.type}${content.id != null ? ` #${content.id}` : ''}${
            content.postId != null ? ` on post #${content.postId}` : ''
          }`
        : '-';
      rows.push(`reported: ${reported}`);
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
