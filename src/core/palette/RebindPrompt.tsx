import { useEffect } from 'preact/hooks';

import { formatTrigger, setTrigger, triggerFromEvent } from '../config';

interface RebindPromptProps {
  active: boolean;
  onClose: () => void;
}

export function RebindPrompt({ active, onClose }: RebindPromptProps) {
  useEffect(() => {
    if (!active) return;
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

  return (
    <div class="sp-backdrop" onClick={onClose}>
      <div class="sp-panel sp-capture" onClick={(e) => e.stopPropagation()}>
        <div class="sp-capture-title">Press a new shortcut to open the palette</div>
        <div class="sp-capture-hint">
          Current: {formatTrigger()} · Esc to cancel
        </div>
      </div>
    </div>
  );
}
