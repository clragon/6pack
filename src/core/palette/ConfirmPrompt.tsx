import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { Breadcrumb, type Crumb } from './Breadcrumb';
import { resolveConfirm, useConfirm } from './confirm';
import { focusNoScroll } from './focus';
import { useNav, returnTo } from './nav';

type Item =
  | { kind: 'field'; key: string }
  | { kind: 'option'; key: string }
  | { kind: 'button'; role: 'cancel' | 'confirm' };

export function ConfirmPrompt() {
  const request = useConfirm();
  const nav = useNav();
  const [values, setValues] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemEls = useRef<(HTMLElement | null)[]>([]);

  const items = useMemo<Item[]>(() => {
    if (!request) return [];
    return [
      ...(request.fields ?? []).map((f): Item => ({ kind: 'field', key: f.key })),
      ...(request.options ?? []).map((o): Item => ({ kind: 'option', key: o.key })),
      { kind: 'button', role: 'cancel' },
      { kind: 'button', role: 'confirm' },
    ];
  }, [request]);

  useEffect(() => {
    if (!request) return;
    const initialValues: Record<string, string> = {};
    for (const field of request.fields ?? []) initialValues[field.key] = field.value ?? '';
    const initialChecked: Record<string, boolean> = {};
    for (const option of request.options ?? []) initialChecked[option.key] = option.default ?? false;
    setValues(initialValues);
    setChecked(initialChecked);
    const fieldCount = request.fields?.length ?? 0;
    const optionCount = request.options?.length ?? 0;
    setSelected(fieldCount > 0 || optionCount > 0 ? 0 : items.length - 1);
  }, [request]);

  useEffect(() => {
    if (!request) return;
    requestAnimationFrame(() => focusNoScroll(itemEls.current[selected] ?? null));
  }, [selected, request]);

  const canConfirm = useMemo(() => {
    if (!request) return false;
    return (request.fields ?? []).every(
      (field) => !field.numeric || /^\d+$/.test((values[field.key] ?? '').trim()),
    );
  }, [request, values]);

  useEffect(() => {
    if (!request) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        resolveConfirm(null);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [request]);

  if (!request) return null;

  const submit = () => {
    if (canConfirm) {
      resolveConfirm({ fields: { ...values }, options: { ...checked } });
    }
  };

  const toggleOption = (key: string) => {
    setChecked((c) => ({ ...c, [key]: !c[key] }));
  };

  const activate = (item: Item) => {
    if (item.kind === 'button') {
      if (item.role === 'confirm') submit();
      else resolveConfirm(null);
    } else if (item.kind === 'option') {
      toggleOption(item.key);
    } else {
      submit();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();
    const item = items[selected];
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected((s) => Math.min(s + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (item) activate(item);
    }
  };

  const crumbs: Crumb[] = nav
    ? [
        ...nav.stack.slice(1).map((level, i) => ({
          label: level.title ?? '',
          onClick: () => {
            resolveConfirm(null);
            returnTo(i + 1);
          },
        })),
        { label: nav.leaf },
      ]
    : [{ label: request.title }];

  const fields = request.fields ?? [];
  const options = request.options ?? [];
  const cancelIndex = fields.length + options.length;
  const confirmIndex = cancelIndex + 1;

  return (
    <div class="sp-backdrop" onClick={() => resolveConfirm(null)}>
      <div
        ref={panelRef}
        class="sp-panel"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div class="sp-input-row">
          <Breadcrumb
            crumbs={crumbs}
            onHome={() => {
              resolveConfirm(null);
              if (nav) returnTo(0);
            }}
          />
          <input class="sp-input" disabled aria-hidden="true" tabIndex={-1} />
        </div>
        <div class="sp-confirm">
          <div class="sp-confirm-title">{request.title}</div>
          {request.detail && (
            <div class="sp-confirm-detail">{request.detail}</div>
          )}

          {fields.map((field, i) => (
            <label
              class={`sp-confirm-field${selected === i ? ' sp-confirm-sel' : ''}`}
              key={field.key}
            >
              <span>{field.label}</span>
              <input
                ref={(el) => {
                  itemEls.current[i] = el;
                }}
                class="sp-confirm-input"
                type="text"
                inputMode={field.numeric ? 'numeric' : undefined}
                placeholder={field.placeholder}
                value={values[field.key] ?? ''}
                onFocus={() => setSelected(i)}
                onInput={(e) =>
                  setValues((v) => ({ ...v, [field.key]: e.currentTarget.value }))
                }
              />
            </label>
          ))}

          {options.map((option, j) => {
            const index = fields.length + j;
            return (
              <label
                class={`sp-confirm-option${selected === index ? ' sp-confirm-sel' : ''}`}
                key={option.key}
              >
                <input
                  ref={(el) => {
                    itemEls.current[index] = el;
                  }}
                  type="checkbox"
                  checked={checked[option.key] ?? false}
                  onFocus={() => setSelected(index)}
                  onChange={(e) =>
                    setChecked((c) => ({
                      ...c,
                      [option.key]: e.currentTarget.checked,
                    }))
                  }
                />
                {option.label}
              </label>
            );
          })}

          <div class="sp-confirm-actions">
            <button
              ref={(el) => {
                itemEls.current[cancelIndex] = el;
              }}
              class={`sp-btn${selected === cancelIndex ? ' sp-confirm-sel' : ''}`}
              onFocus={() => setSelected(cancelIndex)}
              onClick={() => resolveConfirm(null)}
            >
              Cancel
            </button>
            <button
              ref={(el) => {
                itemEls.current[confirmIndex] = el;
              }}
              class={`sp-btn sp-btn-danger${selected === confirmIndex ? ' sp-confirm-sel' : ''}`}
              disabled={!canConfirm}
              onFocus={() => setSelected(confirmIndex)}
              onClick={submit}
            >
              {request.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
