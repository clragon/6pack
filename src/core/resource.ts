interface ResourceName {
  one: string;
  many: string;
}

const NAMES: Record<string, ResourceName> = {
  post: { one: 'post', many: 'posts' },
  post_version: { one: 'post version', many: 'post versions' },
  comment: { one: 'comment', many: 'comments' },
  forum_post: { one: 'forum post', many: 'forum posts' },
  forum: { one: 'forum post', many: 'forum posts' },
  forum_topic: { one: 'forum topic', many: 'forum topics' },
  blip: { one: 'blip', many: 'blips' },
  pool: { one: 'pool', many: 'pools' },
  set: { one: 'set', many: 'sets' },
  wiki: { one: 'wiki page', many: 'wiki pages' },
  user: { one: 'user', many: 'users' },
  dmail: { one: 'DMail', many: 'DMails' },
  ticket: { one: 'ticket', many: 'tickets' },
  ban: { one: 'ban', many: 'bans' },
};

export function resourceName(type: string, count = 1): string {
  const name = NAMES[type];
  if (!name) return count === 1 ? 'item' : 'items';
  return count === 1 ? name.one : name.many;
}
