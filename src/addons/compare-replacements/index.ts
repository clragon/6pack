import type { SixpackAddon } from '../../core/addons/types';
import { approveReplacementAction } from './approve';
import { mountPanel } from './mount';
import COMPARE_CSS from './styles.css?inline';

export const compareReplacementsAddon: SixpackAddon = {
  id: 'compare-replacements',
  name: 'Compare Replacements',
  description:
    'See exactly what a replacement changed before you wave it through, down to the pixel.',
  when: (page) => page.kind === 'postReplacements' && page.postId !== null,
  actions: [approveReplacementAction],
  setup: (ctx) => {
    if (ctx.page.kind !== 'postReplacements' || ctx.page.postId === null) {
      return;
    }
    const postId = ctx.page.postId;

    const style = document.createElement('style');
    style.id = 'compare-replacements';
    style.textContent = COMPARE_CSS;
    document.head.appendChild(style);

    let disposed = false;
    let teardownPanel: (() => void) | undefined;
    ctx.whenReady(() => {
      if (!disposed) teardownPanel = mountPanel(postId);
    });
    return () => {
      disposed = true;
      teardownPanel?.();
      style.remove();
    };
  },
};
