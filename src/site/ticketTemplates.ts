import { probe } from '../core/diag';

// The answer templates offered on a ticket page. Today these come from RE621 Mod
// Tools, which renders one chip per template above the response textarea. This
// module is the only place that knows that: the registry and chip surface consume
// a plain TicketTemplate[], so when RE621 exposes its templates natively (or 6pack
// grows its own) the swap lives here and nowhere else.

export interface TicketTemplate {
  title: string;
  body: string;
}

const RESPONSE_FIELD = "textarea[name='ticket[response]']";
// RE621's chips; the trailing settings chip is icon-only and carries no template.
const TEMPLATE_CHIP =
  '.template-builder-chip:not(.template-builder-chip--icon-only)';

function responseField(): HTMLTextAreaElement | null {
  return document.querySelector<HTMLTextAreaElement>(RESPONSE_FIELD);
}

function templateChips(): HTMLButtonElement[] {
  return Array.from(
    document.querySelectorAll<HTMLButtonElement>(TEMPLATE_CHIP),
  );
}

// Whether this page can actually be handled here: only a ticket page with the
// response field rendered (i.e. the viewer may handle it) can compose and close.
export function canComposeResponse(): boolean {
  return responseField() !== null;
}

// The available templates, in chip order. The chip's text is the title and its
// `title` attribute is the raw body (RE621 sets it only when the body is
// non-empty), which is enough to label the options. The faithful text, with the
// greeting and %reporterName% applied, is recovered at compose time.
export const readTicketTemplates = probe('templates', (): TicketTemplate[] =>
  templateChips().map((chip) => ({
    title: chip.textContent?.trim() ?? '',
    body: chip.getAttribute('title') ?? '',
  })),
);

// Faithful response text for the template at `index`. Clicking RE621's chip runs
// its own transform (greeting + %reporterName%) into the response field, so we
// read the field back rather than reassemble it ourselves. Returns null when the
// chip or field is missing. Note: this populates the visible response box, which
// is honest, the close sends exactly what is shown.
export function composeResponse(index: number): string | null {
  const field = responseField();
  const chip = templateChips()[index];
  if (!field || !chip) return null;
  chip.click();
  return field.value;
}
