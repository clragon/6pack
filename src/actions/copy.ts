import type { Action } from '../core/actions/types';
import { notify } from '../site/toast';

export const copy: Action = {
  id: 'copy',
  title: 'Copy',
  description: 'Copy a reference to the clipboard',
  keywords: ['copy', 'clipboard'],
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
