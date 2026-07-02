import { probe } from '../diag';
import {
  registerTicketResponseProvider,
  type TicketResponseOption,
} from './providers';

const TEMPLATE_CHIP =
  '.template-builder-chip:not(.template-builder-chip--icon-only)';
const RESPONSE_FIELD = "textarea[name='ticket[response]']";

function templateChips(): HTMLButtonElement[] {
  return Array.from(
    document.querySelectorAll<HTMLButtonElement>(TEMPLATE_CHIP),
  );
}

const options = probe('templates', (): TicketResponseOption[] =>
  templateChips().map((chip, index) => ({
    id: String(index),
    title: chip.textContent?.trim() ?? '',
  })),
);

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
