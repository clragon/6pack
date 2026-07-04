import type { Template } from './store';

const SEEDS: Template[] = [
  {
    id: 'ticket-handled',
    title: 'Handled',
    body: 'Hi %reporter%,\n\nThis ticket has been handled, thank you!',
    pinned: true,
  },
  {
    id: 'ticket-reviewed',
    title: 'Reviewed',
    body: 'Hi %reporter%,\n\nThis ticket has been reviewed, thank you!',
    pinned: true,
  },
  {
    id: 'ticket-blacklist',
    title: 'Blacklist',
    body: 'Hi %reporter%,\n\nThank you for your report. This post\'s content does not violate our "uploading guidelines":[/help/uploading_guidelines].\nIf you find the contents of this post objectionable, please add the relevant tags to your "blacklist":[/help/blacklist].',
    pinned: true,
  },
  {
    id: 'ticket-flag',
    title: 'Flag',
    body: 'Hi %reporter%,\n\nThank you for your report. For posts which violate our "uploading guidelines":[/help/uploading_guidelines], please use a "flag":[/help/flag_for_deletion] instead.',
    pinned: true,
  },
];

export function seedTicketReplies(): Template[] {
  return SEEDS.map((t) => ({ ...t }));
}

const APPEAL_SEEDS: Template[] = [
  {
    id: 'appeal-approved',
    title: 'Approved',
    body: 'Hi %reporter%,\n\nYour appeal has been accepted and the post has been restored.',
    pinned: true,
  },
  {
    id: 'appeal-rejected',
    title: 'Rejected',
    body: 'Hi %reporter%,\n\nYour appeal has been rejected and the post will remain deleted.',
    pinned: true,
  },
];

export function seedAppealReplies(): Template[] {
  return APPEAL_SEEDS.map((t) => ({ ...t }));
}

const DMAIL_SEEDS: Template[] = [
  {
    id: 'dmail-outreach',
    title: 'Outreach',
    body: 'Thank you for reaching out.',
    pinned: true,
  },
  {
    id: 'dmail-attempt',
    title: 'Attempt',
    body: 'Thank you for attempting to resolve this.',
    pinned: true,
  },
  {
    id: 'dmail-contesting-deletions',
    title: 'Contesting Deletions',
    body: 'Hi %recipient%,\n\nIf you wish to contest a deletion, please contact the janitor who deleted the post. \nIf they have declined to reinstate your post, you may contact our "Janitor Lead":[/help/staff#list:~:text=Janitor%20Lead] instead.',
  },
  {
    id: 'dmail-takedown-required',
    title: 'Takedown: Required',
    body: 'Hi %recipient%,\n\nThis matter requires a takedown request. Please see "here":[/static/takedown].',
  },
  {
    id: 'dmail-takedown-third-party',
    title: 'Takedown: No Third-party',
    body: 'Hi %recipient%,\n\nOnly artists, character owners, & commissioners may issue takedown requests for their material, & they must do so directly; we do not accept third party takedown requests.',
  },
  {
    id: 'dmail-takedown-see-here',
    title: 'Takedown: See here',
    body: 'Hi %recipient%,\n\nPlease see "here":[/static/takedown] for details about takedown requests.',
  },
];

export function seedDmailReplies(): Template[] {
  return DMAIL_SEEDS.map((t) => ({ ...t }));
}
