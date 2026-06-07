import type { Action } from '../core/actions/types';
import type { PageContext } from '../core/context/types';
import { notify } from '../site/toast';

function dtextRef(page: PageContext): string | null {
  switch (page.kind) {
    case 'post':
      return `post #${page.id}`;
    case 'ticket':
      return `ticket #${page.id}`;
    case 'user':
      return `user #${page.id}`;
    case 'userFeedbacks':
      return page.userId != null ? `user #${page.userId}` : null;
    default:
      return null;
  }
}

export const copy: Action = {
  id: 'copy',
  title: 'Copy',
  description: 'Copy a reference to the clipboard',
  keywords: ['copy', 'clipboard'],
  weight: -5,
  submenu: ({ page }) => {
    const children: Action[] = [];
    if (page.kind === 'post') {
      const id = page.id;
      children.push({
        id: 'copy.id',
        title: 'Post ID',
        keywords: ['id', 'number', 'post'],
        run: () => {
          void navigator.clipboard.writeText(String(id));
          notify(`Copied #${id}`);
        },
      });
    }
    const ref = dtextRef(page);
    if (ref) {
      children.push({
        id: 'copy.dtext',
        title: ref,
        keywords: ['dtext', 'reference', 'ref', 'link', 'markup'],
        run: () => {
          void navigator.clipboard.writeText(ref);
          notify(`Copied ${ref}`);
        },
      });
    }
    children.push({
      id: 'copy.url',
      title: 'Page URL',
      keywords: ['url', 'link', 'address'],
      run: () => {
        void navigator.clipboard.writeText(window.location.href);
        notify('Copied page URL');
      },
    });
    return children;
  },
};
