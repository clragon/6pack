import { resolveForumPostUrl } from './forum';

// Readers for the ticket show page (/tickets/<id>). e621's ticket JSON carries
// only ids, but the DOM renders each party as a link_to_user anchor (id in the
// href, display name in the text), so the table is the richer source and needs no
// extra request. Every reader returns null when its row is absent: the Accused row
// only renders for blip/comment/forum/dmail/user tickets, while the Handled and
// Claimed rows depend on the ticket's stage.

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
  // The reported record's id. Absent when the content was deleted and e621 renders
  // a plain "has been deleted" message instead of a link.
  id?: number;
  href?: string;
  // Comment tickets only: the post the comment lives on, already linked in the row
  // ("on post #<id>"). Lets the comment-in-context command skip a JSON lookup.
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

function idFromHref(href: string | null | undefined, prefix: string): number | undefined {
  const id = Number(href?.match(new RegExp(`^/${prefix}/(\\d+)`))?.[1]);
  return Number.isFinite(id) ? id : undefined;
}

function userFromAnchor(anchor: HTMLAnchorElement | null | undefined): TicketUser | null {
  if (!anchor) return null;
  const id = idFromHref(anchor.getAttribute('href'), 'users');
  if (id === undefined) return null;
  return { id, name: anchor.textContent?.trim() ?? '' };
}

// The first /users/ link inside the row whose title cell reads exactly `label`.
function userInRow(label: string): TicketUser | null {
  const row = rows().find((r) => rowTitle(r) === label);
  return userFromAnchor(row?.querySelector<HTMLAnchorElement>('a[href^="/users/"]'));
}

export function readReporter(): TicketUser | null {
  return userInRow('Requested by');
}

export function readAccused(): TicketUser | null {
  return userInRow('Accused');
}

// Present only once the ticket has a response. Reads "Unknown" (no link) when the
// handler id was lost, which yields null.
export function readHandler(): TicketUser | null {
  return userInRow('Handled by');
}

export function readClaimant(): TicketUser | null {
  return userInRow('Claimed by');
}

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

// Each ticket type partial renders a uniquely-labelled "Reported <X>" row. The map
// recovers the type when the content was deleted and no content link remains.
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
  // Order matters: a comment row also links its post, so /comments/ must win over
  // /posts/, and /forum_posts/ is checked on its own to avoid the /posts/ prefix.
  const comment = row.querySelector<HTMLAnchorElement>('a[href^="/comments/"]');
  if (comment) {
    return {
      type: 'comment',
      id: idFromHref(comment.getAttribute('href'), 'comments'),
      href: comment.getAttribute('href') ?? undefined,
      postId: idFromHref(
        row.querySelector<HTMLAnchorElement>('a[href^="/posts/"]')?.getAttribute('href'),
        'posts',
      ),
    };
  }
  const forum = row.querySelector<HTMLAnchorElement>('a[href^="/forum_posts/"]');
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

// The "Reported <X>" row, classified by its content link, falling back to the row
// label for the type when the content was deleted.
export function readReportedContent(): ReportedContent | null {
  for (const row of rows()) {
    const title = rowTitle(row);
    const labelled = REPORTED_LABELS[title];
    if (!labelled) continue;
    return classifyByLink(row) ?? { type: labelled };
  }
  return null;
}

export function readTicketType(): ReportedType | null {
  return readReportedContent()?.type ?? null;
}

// Eagerly resolve where the reported content opens, so the in-context command can
// point a new tab straight at the destination instead of redirecting a blank one.
// Only forum posts need it: their URL takes a fetch, while comments already carry
// their post id in the DOM.
export function prefetchReportedDestination(): void {
  const content = readReportedContent();
  if (content?.type === 'forum' && content.id != null) {
    void resolveForumPostUrl(content.id);
  }
}
