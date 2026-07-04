import { unsafeWindow } from 'vite-plugin-monkey/dist/client';

export interface DTextEditor {
  node: HTMLElement;
  textarea: HTMLTextAreaElement;
  formatter?: { destroy?: () => void };
}

// A textarea backed by e6's own DText formatter (Write/Preview tabs, toolbar) when
// it is present, falling back to a plain textarea. The formatter only works in the
// page's light DOM, so callers slot this node into a shadow dialog rather than
// build it inside one.
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
  // Makes the formatter fire a native input event after its buttons edit the text.
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
      // Keep the editor a single tab stop (the textarea).
      for (const el of node.querySelectorAll<HTMLElement>(
        'button, a[href], [tabindex]',
      )) {
        if (el !== textarea) el.tabIndex = -1;
      }
    } catch {
      // fall back to the plain textarea
    }
  }
  return { node, textarea, formatter };
}
