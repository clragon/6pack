import { render } from 'preact';
import { useMemo } from 'preact/hooks';

import type { Action } from '../actions/types';
import type { PageContext } from '../context/types';
import { ConfirmPrompt } from './ConfirmPrompt';
import { Palette } from './Palette';
import { RebindPrompt } from './RebindPrompt';
import { captureStore, paletteStore } from './store';
import PALETTE_CSS from './styles.css?inline';
import { useToggle } from './useToggle';

function Root({
  page,
  resolveActions,
}: {
  page: PageContext;
  resolveActions: () => Action[];
}) {
  const open = useToggle(paletteStore);
  const capturing = useToggle(captureStore);
  // Re-resolve on each open so predicates (e.g. approval mode) stay live.
  const actions = useMemo(() => (open ? resolveActions() : []), [open]);
  return (
    <>
      <Palette
        open={open}
        page={page}
        actions={actions}
        onClose={() => paletteStore.set(false)}
      />
      <RebindPrompt
        active={capturing}
        onClose={() => captureStore.set(false)}
      />
      <ConfirmPrompt />
    </>
  );
}

// Mount in a shadow root so e621's element styles can't reach the palette and
// ours can't leak onto the page. Theme custom properties still inherit in.
export function mountPalette(
  page: PageContext,
  resolveActions: () => Action[],
): void {
  const host = document.createElement('div');
  host.id = 'sixpack-palette-host';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = PALETTE_CSS;
  shadow.appendChild(style);

  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);
  render(<Root page={page} resolveActions={resolveActions} />, mountPoint);
}
