import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { Breadcrumb, type Crumb } from './Breadcrumb';
import { resolveConfirm, useConfirm } from './confirm';
import { focusNoScroll } from './focus';
import { useNav, returnTo } from './nav';
import { useOverlay } from './overlay';
import { rove } from './rove';

// A form in the overlay family: fields are plain tab stops, the options and the
// action buttons are rove groups (one tab stop each, arrows walk within). The
// overlay shields e621's hotkeys, so this only handles Escape and Enter.
export function ConfirmPrompt() {
  const request = useConfirm();
  const nav = useNav();
  const [values, setValues] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useOverlay(!!request);

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
    // Land on the first field to type in, else the confirm button so a plain
    // yes/no is one keystroke.
    requestAnimationFrame(() =>
      focusNoScroll(firstFieldRef.current ?? confirmRef.current),
    );
  }, [request]);

  const canConfirm = useMemo(() => {
    if (!request) return false;
    return (request.fields ?? []).every(
      (field) =>
        !field.numeric || /^\d+$/.test((values[field.key] ?? '').trim()),
    );
  }, [request, values]);

  const submit = () => {
    if (canConfirm)
      resolveConfirm({ fields: { ...values }, options: { ...checked } });
  };

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

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      resolveConfirm(null);
    }
  };

  return (
    <div
      class="sp-backdrop"
      onClick={() => resolveConfirm(null)}
      onKeyDown={onKeyDown}
    >
      <div class="sp-shell">
        <div class="sp-panel" onClick={(e) => e.stopPropagation()}>
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
              <label class="sp-confirm-field" key={field.key}>
                <span>{field.label}</span>
                <input
                  ref={i === 0 ? firstFieldRef : undefined}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submit();
                    }
                  }}
                />
              </label>
            ))}

            {options.length > 0 && (
              <div
                class="sp-confirm-options"
                ref={optionsRef}
                onKeyDown={(e) =>
                  rove(optionsRef.current, e, '.sp-confirm-check')
                }
              >
                {options.map((option, j) => (
                  <label class="sp-confirm-option" key={option.key}>
                    <input
                      class="sp-confirm-check"
                      type="checkbox"
                      tabIndex={j === 0 ? 0 : -1}
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
              </div>
            )}

            <div
              class="sp-confirm-actions"
              ref={actionsRef}
              onKeyDown={(e) => rove(actionsRef.current, e, '.sp-btn')}
            >
              <button
                class="sp-btn"
                tabIndex={-1}
                onClick={() => resolveConfirm(null)}
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                class="sp-btn sp-btn-danger"
                tabIndex={0}
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
