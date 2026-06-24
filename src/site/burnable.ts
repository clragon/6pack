export type BurnableType = 'comment' | 'forum_post' | 'user';

export interface BurnableConfig {
  match: RegExp;
  selector: string;
  type: BurnableType;
  idAttr?: string;
  id?: (el: HTMLElement) => string | null;
  controls: { selector: string; position: InsertPosition };
}

const CONFIGS: BurnableConfig[] = [
  {
    match: /^\/posts\/\d+/,
    selector: 'article.comment[data-comment-id]',
    type: 'comment',
    idAttr: 'data-comment-id',
    controls: { selector: 'div.comments', position: 'afterbegin' },
  },
  {
    match: /^\/comments(?:[?.]|\/(?!\d)|$)/,
    selector: 'article.comment[data-comment-id]',
    type: 'comment',
    idAttr: 'data-comment-id',
    controls: { selector: '#c-comments #searchform', position: 'afterend' },
  },
  {
    match: /^\/forum_topics\/\d+/,
    selector: 'article.forum-post[data-forum-post-id]',
    type: 'forum_post',
    idAttr: 'data-forum-post-id',
    controls: {
      selector: '#c-forum-topics #a-show > p.info',
      position: 'afterend',
    },
  },
  {
    match: /^\/users(?:[?.]|\/(?!\d)|$)/,
    selector: '#c-users tbody tr',
    type: 'user',
    id: (el) =>
      el
        .querySelector('a[href^="/users/"]')
        ?.getAttribute('href')
        ?.match(/\/users\/(\d+)/)?.[1] ?? null,
    controls: { selector: '#c-users #searchform', position: 'afterend' },
  },
];

export function currentBurnableConfig(): BurnableConfig | null {
  const path = window.location.pathname;
  return CONFIGS.find((config) => config.match.test(path)) ?? null;
}

export interface Burnable {
  type: BurnableType;
  id: string;
  el: HTMLElement;
  burnt: boolean;
}

export function readBurnables(config = currentBurnableConfig()): Burnable[] {
  if (!config) return [];
  const items: Burnable[] = [];
  document.querySelectorAll<HTMLElement>(config.selector).forEach((el) => {
    const id = config.id
      ? config.id(el)
      : config.idAttr
        ? el.getAttribute(config.idAttr)
        : null;
    if (!id) return;
    items.push({
      type: config.type,
      id,
      el,
      burnt:
        el.getAttribute('data-is-deleted') === 'true' ||
        el.getAttribute('data-is-hidden') === 'true',
    });
  });
  return items;
}
