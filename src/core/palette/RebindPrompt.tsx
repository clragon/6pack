import { useEffect } from 'preact/hooks';

import { Breadcrumb, type Crumb } from './Breadcrumb';
import { formatTrigger, setTrigger, triggerFromEvent } from '../config';
import { useNav, returnTo } from './nav';
import { useOverlay } from './overlay';

interface RebindPromptProps {
  active: boolean;
  onClose: () => void;
}

export function RebindPrompt({ active, onClose }: RebindPromptProps) {
  const nav = useNav();
  useOverlay(active);
  useEffect(() => {
    if (!active) return;
    // Capture phase so the combo is consumed here rather than triggering the
    // palette or an e621 hotkey while we are listening for it.
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      const trigger = triggerFromEvent(event);
      if (!trigger) return;
      setTrigger(trigger);
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, onClose]);

  if (!active) return null;

  const crumbs: Crumb[] = nav
    ? [
        ...nav.stack.slice(1).map((level, i) => ({
          label: level.title ?? '',
          onClick: () => {
            onClose();
            returnTo(nav.stack, i + 1);
          },
        })),
        { label: nav.leaf },
      ]
    : [{ label: 'Change shortcut' }];

  return (
    <div class="sp-backdrop" onClick={onClose}>
      <div class="sp-panel" onClick={(e) => e.stopPropagation()}>
        <div class="sp-input-row">
          <Breadcrumb
            crumbs={crumbs}
            onHome={() => {
              onClose();
              if (nav) returnTo(nav.stack, 0);
            }}
          />
          <input class="sp-input" disabled aria-hidden="true" tabIndex={-1} />
        </div>
        <div class="sp-capture">
          <div class="sp-capture-title">
            Press a new shortcut to open the palette
          </div>
          <div class="sp-capture-hint">
            Current: {formatTrigger()} · Esc to cancel
          </div>
        </div>
      </div>
    </div>
  );
}
