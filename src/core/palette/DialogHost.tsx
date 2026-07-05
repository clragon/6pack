import { useEffect, useRef } from 'preact/hooks';

import { Breadcrumb, type Crumb } from './Breadcrumb';
import { closeDialog, dialogTrail, setDialogTrail, useDialog } from './dialog';
import { useOverlay } from './overlay';
import { openPaletteAt, paletteStore } from './store';

export function DialogHost() {
  const spec = useDialog();
  const hostRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useOverlay(!!spec);

  useEffect(() => {
    const host = hostRef.current;
    if (!spec || !host) return;
    const teardown = spec.render(host, closeDialog, setDialogTrail);
    panelRef.current?.focus({ preventScroll: true });
    return () => teardown?.();
  }, [spec]);

  if (!spec) return null;

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
    }
  };

  const crumbs: Crumb[] = dialogTrail().map((crumb): Crumb => {
    const back = crumb.onClick
      ? crumb.onClick
      : crumb.target
        ? () => {
            closeDialog();
            openPaletteAt(crumb.target as string);
          }
        : undefined;
    return { label: crumb.title, onClick: back };
  });

  return (
    <div
      class="sp-backdrop"
      onClick={() => closeDialog()}
      onKeyDown={onKeyDown}
    >
      <div class="sp-shell sp-shell-dialog">
        <div
          ref={panelRef}
          class="sp-panel"
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
        >
          <div class="sp-input-row sp-dialog-head">
            <Breadcrumb
              crumbs={crumbs}
              onHome={() => {
                closeDialog();
                paletteStore.set(true);
              }}
            />
          </div>
          {spec.styles ? <style>{spec.styles}</style> : null}
          <div ref={hostRef} class="sp-dialog-body" />
        </div>
      </div>
    </div>
  );
}
