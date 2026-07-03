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

export const VARIABLES: TemplateVariable[] = [
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

export function substitute(body: string): string {
  return body.replace(/%(\w+)%/g, (whole, token) => {
    const variable = VARIABLES.find((v) => v.token === token);
    return variable ? variable.resolve() : whole;
  });
}
