import { probe } from '../diag';
import {
  registerTicketResponseProvider,
  type TicketResponseOption,
} from './providers';

// Presents RE621 Mod Tools' response chips as a ticket response provider. RE621
// renders one chip per template above the response textarea; this is the only
// module that knows that shape. RE621 gives the chips no id, so the option id is
// the chip position, which compose resolves back to the chip.

// RE621's chips; the trailing settings chip is icon-only and carries no template.
const TEMPLATE_CHIP =
  '.template-builder-chip:not(.template-builder-chip--icon-only)';
const RESPONSE_FIELD = "textarea[name='ticket[response]']";

function templateChips(): HTMLButtonElement[] {
  return Array.from(
    document.querySelectorAll<HTMLButtonElement>(TEMPLATE_CHIP),
  );
}

// The chip's text is the title; its `title` attribute is the raw body (RE621 sets
// it only when the body is non-empty), which is enough to label the options. The
// faithful text, with the greeting and %reporterName% applied, is recovered at
// compose time.
const options = probe('templates', (): TicketResponseOption[] =>
  templateChips().map((chip, index) => ({
    id: String(index),
    title: chip.textContent?.trim() ?? '',
  })),
);

// Faithful response text for the chip at `index`. Clicking RE621's chip runs its
// own transform (greeting + %reporterName%) into the response field, so we read
// the field back rather than reassemble it. Returns null when the chip or field is
// missing. This populates the visible response box, which is honest: the close
// sends exactly what is shown.
function compose(optionId: string): string | null {
  const field = document.querySelector<HTMLTextAreaElement>(RESPONSE_FIELD);
  const chip = templateChips()[Number(optionId)];
  if (!field || !chip) return null;
  chip.click();
  return field.value;
}

export function installRe621ResponseProvider(): void {
  registerTicketResponseProvider({ id: 're621', list: options, compose });
}
