import {
  readAccused,
  readReportedContent,
  readReporter,
} from '../../site/ticket';
import { currentUserName } from '../../site/user';

export interface TemplateVariable {
  token: string;
  label: string;
  resolve: () => string;
}

function ticketRef(): string {
  const match = location.pathname.match(/^\/tickets\/(\d+)/);
  return match ? `ticket #${match[1]}` : '';
}

function contentRef(): string {
  const content = readReportedContent();
  if (!content) return '';
  return content.id ? `${content.type} #${content.id}` : content.type;
}

export const TICKET_VARIABLES: TemplateVariable[] = [
  {
    token: 'reporter',
    label: 'Reporter',
    resolve: () => readReporter()?.name ?? '',
  },
  {
    token: 'accused',
    label: 'Accused',
    resolve: () => readAccused()?.name ?? '',
  },
  { token: 'me', label: 'Me', resolve: () => currentUserName() ?? '' },
  { token: 'ticket', label: 'Ticket', resolve: ticketRef },
  { token: 'content', label: 'Content', resolve: contentRef },
];

export const APPEAL_VARIABLES: TemplateVariable[] = [
  {
    token: 'reporter',
    label: 'Appellant',
    resolve: () =>
      document.querySelector<HTMLElement>(
        '#c-appeals .appeal-display-report-creator a',
      )?.innerText ?? '',
  },
  { token: 'me', label: 'Me', resolve: () => currentUserName() ?? '' },
];

export const DMAIL_VARIABLES: TemplateVariable[] = [
  {
    token: 'recipient',
    label: 'Recipient',
    resolve: () =>
      document.querySelector<HTMLInputElement>("input[name='dmail[to_name]']")
        ?.value ?? '',
  },
  { token: 'me', label: 'Me', resolve: () => currentUserName() ?? '' },
];

export function substitute(
  body: string,
  variables: TemplateVariable[],
): string {
  return body.replace(/%(\w+)%/g, (whole, token) => {
    const variable = variables.find((v) => v.token === token);
    return variable ? variable.resolve() : whole;
  });
}
