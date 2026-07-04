import { unsafeWindow } from 'vite-plugin-monkey/dist/client';

export interface DTextEditor {
  node: HTMLElement;
  textarea: HTMLTextAreaElement;
  formatter?: { destroy?: () => void };
}

// e621's _dtext_formatter.scss styles the formatter from the page, so the
// returned node lives in the light DOM and is slotted into the dialog.
export function buildDTextEditor(opts: {
  value: string;
  className: string;
  rows?: number;
  placeholder?: string;
  onInput: (value: string) => void;
}): DTextEditor {
  const node = document.createElement('div');
  node.className = opts.className;
  const textarea = document.createElement('textarea');
  textarea.rows = opts.rows ?? 5;
  if (opts.placeholder) textarea.placeholder = opts.placeholder;
  textarea.value = opts.value;
  // e621's DTextFormatter dispatches a native input event after a toolbar edit
  // only when the textarea carries dtext-vue.
  textarea.classList.add('dtext-vue');
  textarea.setAttribute('data-color', 'false');
  node.appendChild(textarea);
  textarea.addEventListener('input', () => opts.onInput(textarea.value));

  let formatter: { destroy?: () => void } | undefined;
  const page = unsafeWindow as unknown as {
    Danbooru?: {
      DTextFormatter?: { buildFromTextarea: (t: unknown) => unknown };
    };
    jQuery?: (el: unknown) => unknown;
  };
  const dtext = page.Danbooru?.DTextFormatter;
  if (dtext && page.jQuery) {
    try {
      formatter = dtext.buildFromTextarea(page.jQuery(textarea)) as {
        destroy?: () => void;
      };
      for (const el of node.querySelectorAll<HTMLElement>(
        'button, a[href], [tabindex]',
      )) {
        if (el !== textarea) el.tabIndex = -1;
      }
    } catch {
      // The textarea stays usable when the formatter fails to mount.
    }
  }
  return { node, textarea, formatter };
}
