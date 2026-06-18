import type { Action } from '../../core/actions/types';
import { openInNewTab, openResolvedInNewTab } from '../../core/navigate';
import { cachedForumPostUrl, resolveForumPostUrl } from '../../site/forum';
import { readReportedContent, type ReportedContent } from '../../site/ticket';
import { notifyError } from '../../site/toast';

function reportedOfType(type: ReportedContent['type']): ReportedContent | null {
  const content = readReportedContent();
  return content && content.type === type && content.id != null
    ? content
    : null;
}

export const viewCommentInContext: Action = {
  id: 'ticket.view-comment',
  title: 'View comment on post',
  description: 'Open the reported comment on its post',
  keywords: [
    'comment',
    'context',
    'post',
    'view',
    'open',
    'reported',
    'ticket',
  ],
  weight: 1,
  when: (page) =>
    page.kind === 'ticket' && reportedOfType('comment')?.postId != null,
  run: () => {
    const content = reportedOfType('comment');
    if (content?.postId == null) return;
    openInNewTab(`/posts/${content.postId}#comment-${content.id}`);
  },
};

export const viewForumPostInContext: Action = {
  id: 'ticket.view-forum-post',
  title: 'View forum post in topic',
  description: 'Open the reported forum post in its topic',
  keywords: [
    'forum',
    'post',
    'topic',
    'context',
    'view',
    'open',
    'reported',
    'ticket',
  ],
  weight: 1,
  when: (page) => page.kind === 'ticket' && reportedOfType('forum') !== null,
  run: () => {
    const content = reportedOfType('forum');
    if (!content || content.id == null) return;
    const ready = cachedForumPostUrl(content.id);
    if (ready) {
      openInNewTab(ready);
    } else {
      openResolvedInNewTab(resolveForumPostUrl(content.id), () =>
        notifyError('Could not locate the forum post in its topic'),
      );
    }
  },
};
