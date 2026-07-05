import type { SixpackAddon } from '../../core/addons/types';
import LEAN_APPROVALS_CSS from './styles.css?inline';

function reorderBar(): () => void {
  const bar = document.querySelector<HTMLElement>(
    '#pending-approval-notice .quick-mod',
  );
  if (!bar) return () => {};

  const groups = Array.from(
    bar.querySelectorAll<HTMLElement>('.quick-mod-group'),
  );
  const original = [...groups];
  const groupWith = (selector: string) =>
    groups.find((g) => g.querySelector(selector)) ?? null;

  const ordered = [
    groupWith('#approve-post'),
    groupWith('.detailed-rejection-link'),
    groupWith('a[href*="confirm_delete"]'),
  ].filter((g): g is HTMLElement => g !== null);
  for (const group of ordered) bar.appendChild(group);

  const next = bar.querySelector<HTMLElement>('#approve-post-next');
  const nextLabel = next?.textContent ?? null;
  if (next) next.textContent = '+ Next';

  return () => {
    if (next && nextLabel !== null) next.textContent = nextLabel;
    for (const group of original) bar.appendChild(group);
  };
}

export const leanApprovalsAddon: SixpackAddon = {
  id: 'lean-approvals',
  name: 'Lean Approvals',
  description:
    'Pares the approvals bar down to approve, delete, and disapprove.',
  when: (page) => page.kind === 'post',
  setup: (ctx) => {
    const style = document.createElement('style');
    style.id = 'lean-approvals';
    style.textContent = LEAN_APPROVALS_CSS;
    document.head.appendChild(style);

    let disposed = false;
    let teardown: (() => void) | undefined;
    ctx.whenReady(() => {
      if (!disposed) teardown = reorderBar();
    });
    return () => {
      disposed = true;
      teardown?.();
      style.remove();
    };
  },
};
