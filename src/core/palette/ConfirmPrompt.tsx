import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { Breadcrumb, type Crumb } from './Breadcrumb';
import { resolveConfirm, useConfirm } from './confirm';
import { focusNoScroll } from './focus';
import { useNav, returnTo } from './nav';
import { useOverlay } from './overlay';

// Every interactive control, flattened in tab order so one cursor (arrow keys)
// walks fields, then checkboxes, then the action buttons, like the command list.
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

  useOverlay(!!request);

  const items = useMemo<Item[]>(() => {
    if (!request) return [];
    return [
      ...(request.fields ?? []).map(
        (f): Item => ({ kind: 'field', key: f.key }),
      ),
      ...(request.options ?? []).map(
        (o): Item => ({ kind: 'option', key: o.key }),
      ),
      { kind: 'button', role: 'cancel' },
      { kind: 'button', role: 'confirm' },
    ];
  }, [request]);

  useEffect(() => {
    if (!request) return;
    const initialValues: Record<string, string> = {};
    for (const field of request.fields ?? [])
      initialValues[field.key] = field.value ?? '';
    const initialChecked: Record<string, boolean> = {};
    for (const option of request.options ?? [])
      initialChecked[option.key] = option.default ?? false;
    setValues(initialValues);
    setChecked(initialChecked);
    // Land on the first thing worth touching: a field to type in, else a checkbox,
    // else the confirm button so a plain yes/no is one keystroke.
    const fieldCount = request.fields?.length ?? 0;
    const optionCount = request.options?.length ?? 0;
    setSelected(fieldCount > 0 || optionCount > 0 ? 0 : items.length - 1);
  }, [request, items.length]);

  // Focus follows the cursor so typing reaches a field and the focus ring shows
  // where you are.
  useEffect(() => {
    if (!request) return;
    requestAnimationFrame(() =>
      focusNoScroll(itemEls.current[selected] ?? null),
    );
  }, [selected, request]);

  const canConfirm = useMemo(() => {
    if (!request) return false;
    return (request.fields ?? []).every(
      (field) =>
        !field.numeric || /^\d+$/.test((values[field.key] ?? '').trim()),
    );
  }, [request, values]);

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

  // Drive the dialog from a capture-phase window listener so it beats e621's
  // document-level hotkeys. The dialog is in a shadow root, so the page reads
  // document.activeElement as the host, not the focused field, and its
  // input-focus guard fails: any key reaching the page fires a hotkey. So swallow
  // propagation for every key, and preventDefault only the ones we handle here,
  // leaving a field to receive its character. A ref carries the fresh closure so
  // the listener subscribes once per dialog, not once per keystroke.
  const onKeyRef = useRef<(event: KeyboardEvent) => void>(() => {});
  onKeyRef.current = (event) => {
    const item = items[selected];
    const inField = item?.kind === 'field';
    event.stopImmediatePropagation();
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        resolveConfirm(null);
        return;
      case 'ArrowDown':
        event.preventDefault();
        setSelected((s) => Math.min(s + 1, items.length - 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
        return;
      case 'Enter':
        event.preventDefault();
        if (item) activate(item);
        return;
      case ' ':
        if (!inField && item) {
          event.preventDefault();
          activate(item);
        }
        return;
    }
  };

  useEffect(() => {
    if (!request) return;
    const onKey = (event: KeyboardEvent) => onKeyRef.current(event);
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [request]);

  if (!request) return null;

  const crumbs: Crumb[] = nav
    ? [
        ...nav.stack.slice(1).map((level, i) => ({
          label: level.title ?? '',
          onClick: () => {
            resolveConfirm(null);
            returnTo(nav.stack, i + 1);
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
      <div class="sp-shell">
        <div
          ref={panelRef}
          class="sp-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <div class="sp-input-row">
            <Breadcrumb
              crumbs={crumbs}
              onHome={() => {
                resolveConfirm(null);
                if (nav) returnTo(nav.stack, 0);
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
                  onInput={(e) =>
                    setValues((v) => ({
                      ...v,
                      [field.key]: e.currentTarget.value,
                    }))
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
                onClick={submit}
              >
                {request.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
