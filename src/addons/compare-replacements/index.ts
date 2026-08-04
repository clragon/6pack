import type { SixpackAddon } from '../../core/addons/types';
import { approveReplacementAction } from './approve';
import { mountPanel } from './mount';
import COMPARE_CSS from './styles.css?inline';

export const compareReplacementsAddon: SixpackAddon = {
  id: 'compare-replacements',
  name: 'Compare Replacements',
  description:
    'The content of a replacement is presented for examination before approval. The proposed file and the current one are shown side by side, under a slider that wipes between them, or as a heatmap of the differing pixels, with zoom and pan applied to both at once. The proportion of the image that changed is stated, so that a benign resize is distinguishable from an edit accompanying it.',
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
