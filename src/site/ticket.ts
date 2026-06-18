import { probe } from '../core/diag';
import { resolveForumPostUrl } from './forum';

export interface TicketUser {
  id: number;
  name: string;
}

export type ReportedType =
  | 'comment'
  | 'forum'
  | 'post'
  | 'user'
  | 'dmail'
  | 'blip'
  | 'pool'
  | 'set'
  | 'wiki'
  | 'replacement';

export interface ReportedContent {
  type: ReportedType;
  id?: number;
  href?: string;
  postId?: number;
}

function ticketTable(): HTMLTableElement | null {
  return document.querySelector<HTMLTableElement>('#c-tickets .section table');
}

function rows(): HTMLTableRowElement[] {
  const table = ticketTable();
  return table ? Array.from(table.querySelectorAll('tr')) : [];
}

function rowTitle(row: HTMLTableRowElement): string {
  return row.querySelector<HTMLElement>('.title')?.textContent?.trim() ?? '';
}

function idFromHref(
  href: string | null | undefined,
  prefix: string,
): number | undefined {
  const id = Number(href?.match(new RegExp(`^/${prefix}/(\\d+)`))?.[1]);
  return Number.isFinite(id) ? id : undefined;
}

function userFromAnchor(
  anchor: HTMLAnchorElement | null | undefined,
): TicketUser | null {
  if (!anchor) return null;
  const id = idFromHref(anchor.getAttribute('href'), 'users');
  if (id === undefined) return null;
  return { id, name: anchor.textContent?.trim() ?? '' };
}

function userInRow(label: string): TicketUser | null {
  const row = rows().find((r) => rowTitle(r) === label);
  return userFromAnchor(
    row?.querySelector<HTMLAnchorElement>('a[href^="/users/"]'),
  );
}

export const readReporter = probe('reporter', (): TicketUser | null =>
  userInRow('Requested by'),
);

export const readAccused = probe('accused', (): TicketUser | null =>
  userInRow('Accused'),
);

export const readHandler = probe('handler', (): TicketUser | null =>
  userInRow('Handled by'),
);

export const readClaimant = probe('claimant', (): TicketUser | null =>
  userInRow('Claimed by'),
);

export interface TicketParties {
  reporter: TicketUser | null;
  accused: TicketUser | null;
  handler: TicketUser | null;
  claimant: TicketUser | null;
}

export function readTicketParties(): TicketParties {
  return {
    reporter: readReporter(),
    accused: readAccused(),
    handler: readHandler(),
    claimant: readClaimant(),
  };
}

const REPORTED_LABELS: Record<string, ReportedType> = {
  'Reported Comment': 'comment',
  'Reported Forum Post': 'forum',
  'Reported Post': 'post',
  'Reported User': 'user',
  'Reported Message': 'dmail',
  'Reported Blip': 'blip',
  'Reported Pool': 'pool',
  'Reported Set': 'set',
  'Reported Wiki Page': 'wiki',
  'Reported Replacement': 'replacement',
};

function classifyByLink(row: HTMLTableRowElement): ReportedContent | null {
  const comment = row.querySelector<HTMLAnchorElement>('a[href^="/comments/"]');
  if (comment) {
    return {
      type: 'comment',
      id: idFromHref(comment.getAttribute('href'), 'comments'),
      href: comment.getAttribute('href') ?? undefined,
      postId: idFromHref(
        row
          .querySelector<HTMLAnchorElement>('a[href^="/posts/"]')
          ?.getAttribute('href'),
        'posts',
      ),
    };
  }
  const forum = row.querySelector<HTMLAnchorElement>(
    'a[href^="/forum_posts/"]',
  );
  if (forum) {
    return {
      type: 'forum',
      id: idFromHref(forum.getAttribute('href'), 'forum_posts'),
      href: forum.getAttribute('href') ?? undefined,
    };
  }
  const dmail = row.querySelector<HTMLAnchorElement>('a[href^="/dmails/"]');
  if (dmail) {
    return {
      type: 'dmail',
      id: idFromHref(dmail.getAttribute('href'), 'dmails'),
      href: dmail.getAttribute('href') ?? undefined,
    };
  }
  const post = row.querySelector<HTMLAnchorElement>('a[href^="/posts/"]');
  if (post) {
    return {
      type: 'post',
      id: idFromHref(post.getAttribute('href'), 'posts'),
      href: post.getAttribute('href') ?? undefined,
    };
  }
  const user = row.querySelector<HTMLAnchorElement>('a[href^="/users/"]');
  if (user) {
    return {
      type: 'user',
      id: idFromHref(user.getAttribute('href'), 'users'),
      href: user.getAttribute('href') ?? undefined,
    };
  }
  return null;
}

export const readReportedContent = probe(
  'reported',
  (): ReportedContent | null => {
    for (const row of rows()) {
      const title = rowTitle(row);
      const labelled = REPORTED_LABELS[title];
      if (!labelled) continue;
      return classifyByLink(row) ?? { type: labelled };
    }
    return null;
  },
);

export function readTicketType(): ReportedType | null {
  return readReportedContent()?.type ?? null;
}

export type TicketStatus = 'pending' | 'partial' | 'approved';
const TICKET_STATUSES: TicketStatus[] = ['pending', 'partial', 'approved'];

export const readTicketStatus = probe('status', (): TicketStatus | null => {
  const row = rows().find((r) => rowTitle(r) === 'Status');
  const cell = row?.querySelector('td:last-child');
  return (
    TICKET_STATUSES.find((status) =>
      cell?.classList.contains(`${status}-ticket`),
    ) ?? null
  );
});

export function prefetchReportedDestination(): void {
  const content = readReportedContent();
  if (content?.type === 'forum' && content.id != null) {
    void resolveForumPostUrl(content.id);
  }
}
