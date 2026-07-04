import type { RecordTemplate } from './store';

// The starter templates a fresh install seeds: the usual set (reasons lifted from
// REMT), pinned by observed frequency, all editable/reorderable/deletable after.
export function seedRecords(): RecordTemplate[] {
  const make = (
    title: string,
    reason: string,
    rules: string[],
    pinned: boolean,
    extra: Partial<RecordTemplate> = {},
  ): RecordTemplate => ({
    id: crypto.randomUUID(),
    title,
    reason,
    rules,
    pinned,
    ...extra,
  });
  return [
    make('Creepy comments', `Please don't make comments like this.`, ['inappropriate'], true),
    make('TMI', `We don't need to know that, please keep it to yourself.`, ['inappropriate'], true),
    make('Trolling', `Don't be a troll.`, ['disruptive'], true),
    make('Blacklist', `Please use your [[e621:blacklist|blacklist]].`, ['blacklist'], true),
    make('Blacklist quietly', `[[e621:blacklist|Blacklist]] quietly, please.`, ['blacklist'], false),
    make('Roleplay', `Please don't role-play in the comments.`, ['roleplay'], true),
    make('Roleplay partners', `This is not the place to look for roleplay partners.`, ['roleplay'], false),
    make('Spam', `Don't spam.`, ['spamming'], true),
    make('Bad tags', `[s]Strikethrough[/s] tags were invalid or inapplicable and have been removed or changed. $S\nPlease use the "Wiki":/wiki/show?title=help:home if you need help understanding the usage of any tags, or ask directly at the Helpdesk on our "Discord":/static/discord. You can also search our "Forum":/forum_topics.`, ['tagging'], true),
    make('Min tags', `You are expected to add at least 10 general category tags when uploading posts. $S\nPlease see our "Tagging Checklist":/help/tagging_checklist, view our "Uploading Guidelines":/help/uploading_guidelines, and consider using the "Related Tags" function on the upload form.\nUse the "Wiki":/wiki/show?title=help:home if you need help understanding the usage of any tags, or ask directly at the Helpdesk on our "Discord":/static/discord. You can also search our "Forum":/forum_topics.`, ['tagging'], true),
    make('Tag vandalism', `Don't remove valid tags from posts.`, ['tagging'], false),
    make('Paysite', `Paysite/commercial content is Do Not Post.`, ['posting'], true),
    make('DNP', `[[artist]] is Do Not Post.`, ['posting'], false),
    make('Conditional DNP', `[[artist]] is conditionally DNP.`, ['posting'], false),
    make('Deleted repost', `Don't reupload previously deleted posts. $S\nIf they were deleted once, they will be deleted again.`, ['posting'], false),
    make('Plagiarism', `We do not tolerate plagiarism.`, ['plagiarism'], false),
    make('Ban evasion', `Ban evasion.`, ['banevasion'], false),
    make('Vote cheating', `Do not use alt accounts to cheat the voting system.`, ['sitetools'], false),
    make(
      'Underage',
      `You need to be 18 to access this page.\nThis ban won't expire, but if you have reached the sufficient age you can request your ban to be lifted by writing an email to management@e621.net.`,
      ['underage'],
      false,
      { category: 'ban', duration: -1, preventLogin: true },
    ),
  ];
}
