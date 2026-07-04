import type { Template } from './store';

const GREETING = 'Hi %reporter%,\n\n';

const FLAG_TEXT =
  'Thank you for the report. However, when a post is not suited for our site, a [i]"flag":[/help/flag_for_deletion][/i] is the correct remedy, as the moderators who handle reports can\'t delete posts (that\'s our janitors\' job). [i]Reports[/i] are for when the [i]conduct[/i] relating to the post is disallowed (e.g. tag warring, removal of valid sources, uploaded with not enough tags, etc.), not for when the post\'s [i]content[/i] itself is disallowed.\n\n';
const FLAG_TEXT_END =
  ', but for future reference, you can flag posts by selecting `Flag` instead of `Report` in the sidebar. If you have trouble remembering, selecting the appropriate reason on either page will redirect you to the correct mechanism if the current one is incorrect.';

interface Seed {
  id: string;
  title: string;
  body: string;
  pinned?: boolean;
}

const SEEDS: Seed[] = [
  {
    id: 'ticket-handled',
    title: 'Handled',
    body: 'This ticket has been handled, thank you!',
    pinned: true,
  },
  {
    id: 'ticket-reviewed',
    title: 'Reviewed',
    body: 'This ticket has been reviewed, thank you!',
  },
  {
    id: 'ticket-nat',
    title: 'NAT',
    body: "Thank you for the heads-up! We've reviewed the ticket and completed our investigation into the matter; however, we've decided it does not warrant action at this time.",
    pinned: true,
  },
  {
    id: 'ticket-closed',
    title: 'Closed',
    body: 'This ticket has been closed.',
  },
  {
    id: 'ticket-already-record',
    title: 'Already (Rec)',
    body: 'Thank you for your report, but this user has already received a record for this matter.',
  },
  {
    id: 'ticket-already-ban',
    title: 'Already (Ban)',
    body: 'Thank you for your report, but this user is already banned.',
  },
  {
    id: 'ticket-blacklist',
    title: 'Blacklist',
    body: 'Thank you for your report, but this post\'s content does not violate our "":[/help/uploading_guidelines].\nIf you find the contents of the post objectionable, we\'d ask you to add the relevant tags (or the post\'s id itself) to your "blacklist":[/help/blacklist].',
    pinned: true,
  },
  {
    id: 'ticket-flag',
    title: 'Flag',
    body: `${FLAG_TEXT}The post has already been flagged${FLAG_TEXT_END}`,
    pinned: true,
  },
  {
    id: 'ticket-dmed',
    title: 'DMed',
    body: "Thank you for your report, we've discussed the matter with them.",
  },
];

export function seedTicketReplies(): Template[] {
  return SEEDS.map((s) => ({
    id: s.id,
    title: s.title,
    body: GREETING + s.body,
    pinned: s.pinned,
  }));
}
