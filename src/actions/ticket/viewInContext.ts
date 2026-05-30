import type { Action } from '../../core/actions/types';
import { openInNewTab, openResolvedInNewTab } from '../../core/navigate';
import { resolveCommentUrl } from '../../site/comment';
import { resolveForumPostUrl } from '../../site/forum';
import { readReportedContent, type ReportedContent } from '../../site/ticket';
import { notifyError } from '../../site/toast';

// The reported content, but only when it is the given type and still has an id
// (deleted content renders no link, so there is nowhere to navigate).
function reportedOfType(type: ReportedContent['type']): ReportedContent | null {
  const content = readReportedContent();
  return content && content.type === type && content.id != null ? content : null;
}

export const viewCommentInContext: Action = {
  id: 'ticket.view-comment',
  title: 'View comment on post',
  description: 'Open the reported comment on its post',
  keywords: ['comment', 'context', 'post', 'view', 'open', 'reported', 'ticket'],
  weight: 1,
  when: (page) => page.kind === 'ticket' && reportedOfType('comment') !== null,
  run: () => {
    const content = reportedOfType('comment');
    if (!content || content.id == null) return;
    // Keep the ticket open: open the comment in its post in a new tab.
    if (content.postId != null) {
      openInNewTab(`/posts/${content.postId}#comment-${content.id}`);
    } else {
      openResolvedInNewTab(resolveCommentUrl(content.id), () =>
        notifyError("Could not find the comment's post"),
      );
    }
  },
};

export const viewForumPostInContext: Action = {
  id: 'ticket.view-forum-post',
  title: 'View forum post in topic',
  description: 'Open the reported forum post in its topic',
  keywords: ['forum', 'post', 'topic', 'context', 'view', 'open', 'reported', 'ticket'],
  weight: 1,
  when: (page) => page.kind === 'ticket' && reportedOfType('forum') !== null,
  run: () => {
    const content = reportedOfType('forum');
    if (!content || content.id == null) return;
    // Keep the ticket open: open the forum post in its topic in a new tab.
    openResolvedInNewTab(resolveForumPostUrl(content.id), () =>
      notifyError('Could not locate the forum post in its topic'),
    );
  },
};
