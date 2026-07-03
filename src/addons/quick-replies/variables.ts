import {
  readAccused,
  readReportedContent,
  readReporter,
} from '../../site/ticket';
import { currentUserName } from '../../site/user';

// A token writable in a template body as %token%, resolved from the ticket at
// insert time. The chips in the editor are built from this list, so adding a
// variable here surfaces it in the UI.
export interface TemplateVariable {
  token: string;
  // What it stands for, shown on its chip.
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

// Expand every known %token%; an unknown token is left verbatim.
export function substitute(body: string): string {
  return body.replace(/%(\w+)%/g, (whole, token) => {
    const variable = VARIABLES.find((v) => v.token === token);
    return variable ? variable.resolve() : whole;
  });
}
