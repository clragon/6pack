import { probe } from '../core/diag';

export interface TicketTemplate {
  title: string;
  body: string;
}

const RESPONSE_FIELD = "textarea[name='ticket[response]']";
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

export function canComposeResponse(): boolean {
  return responseField() !== null;
}

export const readTicketTemplates = probe('templates', (): TicketTemplate[] =>
  templateChips().map((chip) => ({
    title: chip.textContent?.trim() ?? '',
    body: chip.getAttribute('title') ?? '',
  })),
);

export function composeResponse(index: number): string | null {
  const field = responseField();
  const chip = templateChips()[index];
  if (!field || !chip) return null;
  chip.click();
  return field.value;
}
