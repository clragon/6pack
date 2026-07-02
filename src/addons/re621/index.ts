import type { SixpackAddon } from '../../core/addons/types';
import type {
  TicketResponseOption,
  TicketResponseProvider,
} from '../../core/tickets/providers';
import { probe } from '../../core/diag';

const TEMPLATE_CHIP =
  '.template-builder-chip:not(.template-builder-chip--icon-only)';
const RESPONSE_FIELD = "textarea[name='ticket[response]']";

function templateChips(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(TEMPLATE_CHIP));
}

const options = probe('templates', (): TicketResponseOption[] =>
  templateChips().map((chip, index) => ({
    id: String(index),
    title: chip.textContent?.trim() ?? '',
  })),
);

// RE621's template chips carry no id and fill the response field on click, so
// the option id is the chip index and the text is read back from the field.
function compose(optionId: string): string | null {
  const field = document.querySelector<HTMLTextAreaElement>(RESPONSE_FIELD);
  const chip = templateChips()[Number(optionId)];
  if (!field || !chip) return null;
  chip.click();
  return field.value;
}

const provider: TicketResponseProvider = { id: 're621', list: options, compose };

export const re621Addon: SixpackAddon = {
  id: 're621',
  name: 'RE621 Responses',
  ticketResponses: provider,
};
