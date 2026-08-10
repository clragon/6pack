import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ChevronDown, ChevronUp, Flame } from 'lucide-preact';
import { unsafeWindow } from 'vite-plugin-monkey/dist/client';

import { assembleRecord } from './compositor';
import { openTemplateManager } from './manager';
import { RULES } from './rules';
import { RuleGroups } from './ruleGroups';
import { rove } from '../../core/palette/rove';
import { rankRules, recordRuleUse } from './ruleFrecency';
import { templateStore, type FeedbackTemplate } from './store';
import { STYLES } from './styles';
import type { EmbedTarget } from './targets';

interface Formatter {
  state: string;
  updatePreview: () => void;
}

function getFormatter(anchor: Element): Formatter | null {
  const page = unsafeWindow as unknown as {
    jQuery?: (el: unknown) => { data: (key: string) => unknown };
  };
  // e621's DTextFormatter stores itself as jQuery data 'instance' on its
  // wrapper.
  const found = page.jQuery?.(anchor).data('instance');
  return (found as Formatter) ?? null;
}

function useTemplates(): FeedbackTemplate[] {
  const [, force] = useState(0);
  useEffect(() => templateStore.subscribe(() => force((n) => n + 1)), []);
  return templateStore.list();
}

function SourceFields({
  sources,
  onChange,
}: {
  sources: string[];
  onChange: (next: string[]) => void;
}) {
  const rows =
    sources.length === 0 || sources[sources.length - 1].trim() !== ''
      ? [...sources, '']
      : sources;

  const setAt = (index: number, value: string) => {
    const next = [...rows];
    next[index] = value;
    if (index === next.length - 1 && value.trim() !== '') next.push('');
    onChange(next);
  };
  const removeAt = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length ? next : ['']);
  };

  return (
    <div class="sp-qf-sources-list">
      {rows.map((value, index) => (
        <div class="sp-qf-source-row" key={index}>
          <input
            type="text"
            class="sp-qf-source"
            placeholder="Source link"
            value={value}
            onInput={(e) => setAt(index, e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              e.currentTarget
                .closest('.sp-qf-source-row')
                ?.nextElementSibling?.querySelector<HTMLElement>(
                  '.sp-qf-source',
                )
                ?.focus();
            }}
            onBlur={() => {
              if (index !== rows.length - 1 && value.trim() === '')
                removeAt(index);
            }}
          />
          <button
            type="button"
            class="sp-qf-source-x"
            tabIndex={-1}
            title="Remove"
            onClick={() => removeAt(index)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function Embed({
  field,
  anchor,
  target,
}: {
  field: HTMLTextAreaElement;
  anchor: Element;
  target: EmbedTarget;
}) {
  const [reason, setReason] = useState('');
  const [active, setActive] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>(['']);
  const [moreOpen, setMoreOpen] = useState(false);
  const [templatesExpanded, setTemplatesExpanded] = useState(false);
  const templates = useTemplates();
  const pinned = templates.filter((t) => t.pinned);
  const shownTemplates = templatesExpanded ? templates : pinned;

  const started = useRef(false);
  const switched = useRef(false);
  const previewTimer = useRef<number>();
  const stripRef = useRef<HTMLDivElement>(null);
  const rulesRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      return;
    }
    field.value = assembleRecord({ reason, rules: active, sources });
    field.dispatchEvent(new Event('input', { bubbles: true }));
    clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => {
      const formatter = getFormatter(anchor);
      if (!formatter) return;
      if (!switched.current) {
        formatter.state = 'preview';
        switched.current = true;
      } else if (formatter.state === 'preview') {
        formatter.updatePreview();
      }
    }, 300);
  }, [reason, active, sources, field, anchor]);

  useEffect(() => {
    const formatter = getFormatter(anchor);
    if (formatter && !switched.current) {
      formatter.state = 'preview';
      switched.current = true;
    }
    return () => clearTimeout(previewTimer.current);
  }, [anchor]);

  useEffect(() => {
    const el = reasonRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [reason]);

  const toggleRule = (key: string) =>
    setActive((a) => {
      if (a.includes(key)) return a.filter((k) => k !== key);
      recordRuleUse([key]);
      return [...a, key];
    });

  const frequentRules = useMemo(
    () => rankRules(Object.keys(RULES)).slice(0, 8),
    [],
  );
  const collapsedKeys = [
    ...frequentRules,
    ...active.filter((key) => !frequentRules.includes(key)),
  ];

  return (
    <>
      <div
        class="sp-qf-strip"
        ref={stripRef}
        onKeyDown={(e) =>
          rove(
            stripRef.current,
            e,
            '.sp-qf-chip, .sp-qf-strip-more, .sp-qf-strip-flame',
          )
        }
      >
        {shownTemplates.map((template, index) => (
          <button
            type="button"
            class="sp-qf-chip"
            key={template.id}
            tabIndex={index === 0 ? 0 : -1}
            onClick={() => target.pick(template, { setReason, setActive })}
          >
            {template.title || '(untitled)'}
          </button>
        ))}
        {templates.length > pinned.length && (
          <button
            type="button"
            class="sp-qf-strip-more"
            tabIndex={-1}
            onClick={() => setTemplatesExpanded((o) => !o)}
          >
            <span>{templatesExpanded ? 'Less' : 'More'}</span>
            {templatesExpanded ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
        )}
        <button
          type="button"
          class="sp-qf-strip-flame"
          tabIndex={shownTemplates.length ? -1 : 0}
          onClick={() => openTemplateManager()}
        >
          <Flame size={16} fill="currentColor" />
          <span>Quick feedbacks</span>
        </button>
      </div>

      <div class="sp-qf-label">Reason</div>
      <textarea
        ref={reasonRef}
        class="sp-qf-input sp-qf-grow"
        rows={1}
        placeholder="Reason"
        value={reason}
        onInput={(e) => setReason(e.currentTarget.value)}
      />

      <div class="sp-qf-label">Rules</div>
      {moreOpen ? (
        <>
          <RuleGroups
            isActive={(key) => active.includes(key)}
            onToggle={toggleRule}
          />
          <button
            type="button"
            class="sp-qf-more"
            onClick={() => setMoreOpen(false)}
          >
            <span>Less</span>
            <ChevronUp size={14} />
          </button>
        </>
      ) : (
        <div
          class="sp-qf-rules"
          ref={rulesRef}
          onKeyDown={(e) =>
            rove(rulesRef.current, e, '.sp-qf-pill, .sp-qf-more')
          }
        >
          {collapsedKeys.map((key, index) => (
            <button
              type="button"
              key={key}
              tabIndex={index === 0 ? 0 : -1}
              class={'sp-qf-pill' + (active.includes(key) ? ' sp-qf-on' : '')}
              onClick={() => toggleRule(key)}
            >
              {RULES[key].title}
            </button>
          ))}
          <button
            type="button"
            class="sp-qf-more"
            tabIndex={collapsedKeys.length ? -1 : 0}
            onClick={() => setMoreOpen(true)}
          >
            <span>More</span>
            <ChevronDown size={14} />
          </button>
        </div>
      )}

      <div class="sp-qf-label">Sources</div>
      <SourceFields sources={sources} onChange={setSources} />

      <div class="sp-qf-label sp-qf-output">{target.outputLabel}</div>
    </>
  );
}

export function mountEmbed(target: EmbedTarget): () => void {
  const field = document.querySelector<HTMLTextAreaElement>(target.field);
  const anchor = field?.closest('.dtext-formatter') ?? field;
  if (!field || !anchor) return () => {};

  const host = document.createElement('div');
  anchor.insertAdjacentElement('beforebegin', host);
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = STYLES;
  const panel = document.createElement('div');
  panel.className = 'sp-qf-panel';
  shadow.append(style, panel);
  render(<Embed field={field} anchor={anchor} target={target} />, panel);

  return () => {
    render(null, panel);
    host.remove();
  };
}
