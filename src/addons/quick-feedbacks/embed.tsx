import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ChevronDown, ChevronUp, Flame } from 'lucide-preact';
import { unsafeWindow } from 'vite-plugin-monkey/dist/client';

import { navigateTo } from '../../core/navigate';
import { assembleRecord } from './compositor';
import { openRecordsManager } from './manager';
import { RULES } from './rules';
import { RuleGroups } from './ruleGroups';
import { rove } from './rove';
import { rankRules, recordRuleUse } from './ruleFrecency';
import { listRecords, subscribe, type RecordTemplate } from './store';
import { STYLES } from './styles';

const BODY_FIELD = "textarea[name='user_feedback[body]']";

interface Formatter {
  state: string;
  updatePreview: () => void;
}

// e6 stashes its formatter on the wrapper; reach it to drive the preview.
function getFormatter(anchor: Element): Formatter | null {
  const page = unsafeWindow as unknown as {
    jQuery?: (el: unknown) => { data: (key: string) => unknown };
  };
  const found = page.jQuery?.(anchor).data('instance');
  return (found as Formatter) ?? null;
}

function useRecords(): RecordTemplate[] {
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);
  return listRecords();
}

// A list of source links: always one trailing empty field to type into, an "x" to
// drop a row, and empty rows prune themselves on blur. Enter proceeds to the next
// link rather than submitting the form.
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
    <div class="qf-sources-list">
      {rows.map((value, index) => (
        <div class="qf-source-row" key={index}>
          <input
            type="text"
            class="qf-source"
            placeholder="Source link"
            value={value}
            onInput={(e) => setAt(index, e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              e.currentTarget
                .closest('.qf-source-row')
                ?.nextElementSibling?.querySelector<HTMLElement>('.qf-source')
                ?.focus();
            }}
            onBlur={() => {
              if (index !== rows.length - 1 && value.trim() === '')
                removeAt(index);
            }}
          />
          <button
            type="button"
            class="qf-source-x"
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
}: {
  field: HTMLTextAreaElement;
  anchor: Element;
}) {
  const [reason, setReason] = useState('');
  const [active, setActive] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>(['']);
  const [moreOpen, setMoreOpen] = useState(false);
  const [templatesExpanded, setTemplatesExpanded] = useState(false);
  const records = useRecords();
  const pinned = records.filter((t) => t.pinned);
  const shownTemplates = templatesExpanded ? records : pinned;

  const started = useRef(false);
  const switched = useRef(false);
  const previewTimer = useRef<number>();
  const stripRef = useRef<HTMLDivElement>(null);
  const rulesRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  // Compose into e6's textarea and refresh its preview. Skips the first run so a
  // prefilled body is not wiped before the mod touches anything.
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

  // Show the rendered record on load.
  useEffect(() => {
    const formatter = getFormatter(anchor);
    if (formatter && !switched.current) {
      formatter.state = 'preview';
      switched.current = true;
    }
    return () => clearTimeout(previewTimer.current);
  }, [anchor]);

  // Grow the reason field to fit its content, a single line by default.
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

  // Ranked once per open so the pills don't shuffle mid-edit; picks feed back in.
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
        class="qf-strip"
        ref={stripRef}
        onKeyDown={(e) =>
          rove(stripRef.current, e, '.qf-chip, .qf-strip-more, .qf-strip-flame')
        }
      >
        {shownTemplates.map((template, index) => (
          <button
            type="button"
            class="qf-chip"
            key={template.id}
            tabIndex={index === 0 ? 0 : -1}
            onClick={() => {
              if (template.category === 'ban') {
                const userName =
                  document.querySelector<HTMLInputElement>(
                    'input[name="user_feedback[user_name]"]',
                  )?.value ?? '';
                const params = new URLSearchParams();
                if (userName) params.set('ban[user_name]', userName);
                params.set(
                  'ban[reason]',
                  assembleRecord({
                    reason: template.reason,
                    rules: template.rules,
                    sources: [],
                  }),
                );
                if (template.duration != null)
                  params.set('ban[duration]', String(template.duration));
                if (template.preventLogin)
                  params.set('ban[prevent_login]', '1');
                navigateTo(`/bans/new?${params}`);
                return;
              }
              setReason(template.reason);
              setActive([...template.rules]);
              recordRuleUse(template.rules);
              if (template.category)
                document
                  .querySelector<HTMLInputElement>(
                    `input[name="user_feedback[category]"][value="${template.category}"]`,
                  )
                  ?.click();
            }}
          >
            {template.title || '(untitled)'}
          </button>
        ))}
        {records.length > pinned.length && (
          <button
            type="button"
            class="qf-strip-more"
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
          class="qf-strip-flame"
          tabIndex={shownTemplates.length ? -1 : 0}
          onClick={() => openRecordsManager()}
        >
          <Flame size={16} fill="currentColor" />
          <span>Quick feedbacks</span>
        </button>
      </div>

      <div class="qf-label">Reason</div>
      <textarea
        ref={reasonRef}
        class="qf-input qf-grow"
        rows={1}
        placeholder="Reason"
        value={reason}
        onInput={(e) => setReason(e.currentTarget.value)}
      />

      <div class="qf-label">Rules</div>
      {moreOpen ? (
        <>
          <RuleGroups
            isActive={(key) => active.includes(key)}
            onToggle={toggleRule}
          />
          <button
            type="button"
            class="qf-more"
            onClick={() => setMoreOpen(false)}
          >
            <span>Less</span>
            <ChevronUp size={14} />
          </button>
        </>
      ) : (
        <div
          class="qf-rules"
          ref={rulesRef}
          onKeyDown={(e) => rove(rulesRef.current, e, '.qf-pill, .qf-more')}
        >
          {collapsedKeys.map((key, index) => (
            <button
              type="button"
              key={key}
              tabIndex={index === 0 ? 0 : -1}
              class={'qf-pill' + (active.includes(key) ? ' qf-on' : '')}
              onClick={() => toggleRule(key)}
            >
              {RULES[key].title}
            </button>
          ))}
          <button
            type="button"
            class="qf-more"
            tabIndex={collapsedKeys.length ? -1 : 0}
            onClick={() => setMoreOpen(true)}
          >
            <span>More</span>
            <ChevronDown size={14} />
          </button>
        </div>
      )}

      <div class="qf-label">Sources</div>
      <SourceFields sources={sources} onChange={setSources} />

      <div class="qf-label qf-output">Record</div>
    </>
  );
}

export function mountEmbed(): () => void {
  const field = document.querySelector<HTMLTextAreaElement>(BODY_FIELD);
  const anchor = field?.closest('.dtext-formatter') ?? field;
  if (!field || !anchor) return () => {};

  // Render into a shadow root so e6's form CSS can't reach our fields.
  const host = document.createElement('div');
  anchor.insertAdjacentElement('beforebegin', host);
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = STYLES;
  const panel = document.createElement('div');
  panel.className = 'qf-panel';
  shadow.append(style, panel);
  render(<Embed field={field} anchor={anchor} />, panel);

  return () => {
    render(null, panel);
    host.remove();
  };
}
