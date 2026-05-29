import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { Breadcrumb, type Crumb } from './Breadcrumb';
import { resolveConfirm, useConfirm } from './confirm';
import { focusNoScroll } from './focus';
import { useNav, returnTo } from './nav';

export function ConfirmPrompt() {
  const request = useConfirm();
  const nav = useNav();
  const [values, setValues] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!request) return;
    const initialValues: Record<string, string> = {};
    for (const field of request.fields ?? []) {
      initialValues[field.key] = field.value ?? '';
    }
    const initialChecked: Record<string, boolean> = {};
    for (const option of request.options ?? []) {
      initialChecked[option.key] = option.default ?? false;
    }
    setValues(initialValues);
    setChecked(initialChecked);

    // Focus the first thing worth touching: a field, else a checkbox, else the
    // confirm button. Lets Tab/Space navigate the rest naturally.
    requestAnimationFrame(() => {
      const selector =
        (request.fields?.length ?? 0) > 0
          ? '.sp-confirm-input'
          : (request.options?.length ?? 0) > 0
            ? 'input[type="checkbox"]'
            : '.sp-btn-danger';
      focusNoScroll(panelRef.current?.querySelector<HTMLElement>(selector) ?? null);
    });
  }, [request]);

  const canConfirm = useMemo(() => {
    if (!request) return false;
    return (request.fields ?? []).every(
      (field) => !field.numeric || /^\d+$/.test((values[field.key] ?? '').trim()),
    );
  }, [request, values]);

  // Escape cancels even if focus has wandered out of the panel.
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

  // Keep keystrokes off e621's hotkeys. Submit on Enter only when focus is not
  // on a checkbox or button, so Tab/Space navigate those natively.
  const onKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();
    if (event.key !== 'Enter') return;
    const target = event.target as HTMLElement;
    const isCheckbox =
      target instanceof HTMLInputElement && target.type === 'checkbox';
    if (target.tagName === 'BUTTON' || isCheckbox) return;
    event.preventDefault();
    submit();
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

          {(request.fields ?? []).map((field) => (
            <label class="sp-confirm-field" key={field.key}>
              <span>{field.label}</span>
              <input
                class="sp-confirm-input"
                type="text"
                inputMode={field.numeric ? 'numeric' : undefined}
                placeholder={field.placeholder}
                value={values[field.key] ?? ''}
                onInput={(e) =>
                  setValues((v) => ({ ...v, [field.key]: e.currentTarget.value }))
                }
              />
            </label>
          ))}

          {(request.options ?? []).map((option) => (
            <label class="sp-confirm-option" key={option.key}>
              <input
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
          ))}

          <div class="sp-confirm-actions">
            <button class="sp-btn" onClick={() => resolveConfirm(null)}>
              Cancel
            </button>
            <button
              class="sp-btn sp-btn-danger"
              disabled={!canConfirm}
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
