import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { ChevronDown, ChevronUp, Flame } from 'lucide-preact';

import { rove } from '../../core/palette/rove';
import type { ReplyContext } from './context';
import { openManager } from './manager';
import { type Template } from './store';
import { ensureStyles } from './styles';
import { substitute } from './variables';

function useTemplates(context: ReplyContext): Template[] {
  const [, force] = useState(0);
  useEffect(() => context.store.subscribe(() => force((n) => n + 1)), [context]);
  return context.store.list();
}

function Strip({ context }: { context: ReplyContext }) {
  const templates = useTemplates(context);
  const pinned = templates.filter((t) => t.pinned);
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? templates : pinned;
  const stripRef = useRef<HTMLDivElement>(null);

  const insert = (body: string): void => {
    const field = context.field();
    if (!field) return;
    field.value = substitute(body, context.variables);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.focus();
  };

  return (
    <div
      class="sp-qr-strip"
      ref={stripRef}
      onKeyDown={(e) =>
        rove(
          stripRef.current,
          e,
          '.sp-qr-strip-btn, .sp-qr-strip-more, .sp-qr-strip-flame',
        )
      }
    >
      {shown.map((template, index) => (
        <button
          type="button"
          class="sp-qr-strip-btn"
          key={template.id}
          tabIndex={index === 0 ? 0 : -1}
          title="Insert this reply"
          onClick={() => insert(template.body)}
        >
          {template.title || '(untitled)'}
        </button>
      ))}
      {templates.length > pinned.length && (
        <button
          type="button"
          class="sp-qr-strip-more"
          tabIndex={-1}
          onClick={() => setExpanded((o) => !o)}
        >
          <span>{expanded ? 'Less' : 'More'}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}
      <button
        type="button"
        class="sp-qr-strip-flame"
        tabIndex={shown.length ? -1 : 0}
        onClick={() => openManager(context)}
      >
        <Flame size={16} fill="currentColor" />
        <span>{context.label}</span>
      </button>
    </div>
  );
}

export function mountStrip(context: ReplyContext): () => void {
  const field = context.field();
  const anchor = field?.closest('.dtext-formatter') ?? field;
  if (!anchor) return () => {};

  ensureStyles();
  const host = document.createElement('div');
  anchor.insertAdjacentElement('afterend', host);
  render(<Strip context={context} />, host);

  return () => {
    render(null, host);
    host.remove();
  };
}
