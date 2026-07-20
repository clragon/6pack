// The domain and alias tables and the label helpers follow url-utils.ts in
// Förderband's frontend.
const DECORATABLE_DOMAINS = [
  'e621.net',
  'linktr.ee',
  'carrd.co',
  'artfight.net',
  'artstation.com',
  'archiveofourown.org',
  'aryion.com',
  'derpibooru.org',
  'deviantart.com',
  'furaffinity.net',
  'furrynetwork.com',
  'furrystation.com',
  'hentai-foundry.com',
  'hiccears.com',
  'imgbb.com',
  'imgur.com',
  'inkbunny.net',
  'itaku.ee',
  'pillowfort.social',
  'pixiv.net',
  'pornhub.com',
  'redgifs.com',
  'skeb.jp',
  'sofurry.com',
  'toyhou.se',
  'tumblr.com',
  'tumbex.com',
  'newgrounds.com',
  'yiff.life',
  'weasyl.com',
  'webtoons.com',
  'aethy.com',
  'bsky.app',
  'bilibili.com',
  'blogspot.com',
  'cohost.org',
  'facebook.com',
  'instagram.com',
  'mastodon.social',
  'nijie.info',
  'pawoo.net',
  'plurk.com',
  'privatter.net',
  'reddit.com',
  'tiktok.com',
  'twitter.com',
  'vk.com',
  'weibo.com',
  'youtube.com',
  'picarto.tv',
  'piczel.tv',
  'twitch.tv',
  'artconomy.com',
  'boosty.to',
  'buymeacoffee.com',
  'commishes.com',
  'gumroad.com',
  'etsy.com',
  'fanbox.cc',
  'fiverr.com',
  'itch.io',
  'ko-fi.com',
  'patreon.com',
  'redbubble.com',
  'subscribestar.adult',
  'amazonaws.com',
  'catbox.moe',
  'drive.google.com',
  'dropbox.com',
  'mega.nz',
  'onedrive.live.com',
  'agn.ph',
  '4chan.org',
  'chakatsden.com',
  'danbooru.donmai.us',
  'desuarchive.org',
  'e-hentai.org',
  'fluffy-community.com',
  'furbooru.org',
  'gelbooru.com',
  'snootbooru.com',
  'rule34.paheal.net',
  'rule34.xxx',
  'u18chan.com',
  'img.booru.org',
  'catarchive.booru.org',
  'trashdump.booru.org',
  'zoo.booru.org',
  'the-collection.booru.org',
  'curiouscat.me',
  'discord.com',
  'fandom.com',
  'f-list.net',
  'knowyourmeme.com',
  'neocities.org',
  'steamcommunity.com',
  't.me',
  'trello.com',
  'web.archive.org',
  'wordpress.com',
  'wikimedia.org',
];

const DECORATABLE_ALIASES: Record<string, string> = {
  'archiveofourown.com': 'archiveofourown.org',
  'co.llection.pics': 'the-collection.booru.org',
  'curiouscat.live': 'curiouscat.me',
  'derpiboo.ru': 'derpibooru.org',
  'discord.gg': 'discord.com',
  'e926.net': 'e621.net',
  'exhentai.org': 'e-hentai.org',
  'fav.me': 'deviantart.com',
  'hath.network': 'e-hentai.org',
  'pillowfort.io': 'pillowfort.social',
  'pixiv.me': 'pixiv.net',
  'subscribestar.com': 'subscribestar.adult',
  'vk.me': 'vk.com',
  'wikia.com': 'fandom.com',
  'x.com': 'twitter.com',
  'youtu.be': 'youtube.com',

  'baraag.net': 'mastodon.social',
  'cloudfront.net': 'amazonaws.com',
  'mastodon.art': 'mastodon.social',
  'meow.social': 'mastodon.social',
  'pawb.fun': 'mastodon.social',
  'sta.sh': 'deviantart.com',

  '4cdn.org': '4chan.org',
  'cdn.donmai.us': 'danbooru.donmai.us',
  'cohostcdn.org': 'cohost.org',
  'discordapp.com': 'discord.com',
  'desu-usergeneratedcontent.xyz': 'desuarchive.org',
  'derpicdn.net': 'derpibooru.org',
  'deviantart.net': 'deviantart.com',
  'dropboxusercontent.com': 'dropbox.com',
  'facdn.net': 'furaffinity.net',
  'fbcdn.net': 'facebook.com',
  'furrycdn.org': 'furbooru.org',
  'ibb.co': 'imgbb.com',
  'ib.metapix.net': 'inkbunny.net',
  'i.kym-cdn.com': 'knowyourmeme.com',
  'ngfiles.com': 'newgrounds.com',
  'patreonusercontent.com': 'patreon.com',
  'pximg.net': 'pixiv.net',
  'redd.it': 'reddit.com',
  'sinaimg.cn': 'weibo.com',
  'sofurryfiles.com': 'sofurry.com',
  'static.wikia.nocookie.net': 'fandom.com',
  'twimg.com': 'twitter.com',
  'ungrounded.net': 'newgrounds.com',
  'userapi.com': 'vk.com',
  'weibo.cn': 'weibo.com',
  'wixmp.com': 'deviantart.com',

  'us-east.host.bsky.network': 'bsky.app',
  'us-west.host.bsky.network': 'bsky.app',
};

export const getHostnameForLink = (url: string): string | null => {
  try {
    const uri = new URL(url);
    if (!uri.hostname) return null;

    const hostname = uri.hostname.replace(/^www\./, '');

    if (DECORATABLE_DOMAINS.includes(hostname)) {
      return hostname;
    }

    if (DECORATABLE_ALIASES[hostname]) {
      return DECORATABLE_ALIASES[hostname];
    }

    const parts = hostname.split('.');
    if (parts.length > 2) {
      const remainingHostname = parts.slice(1).join('.');
      if (DECORATABLE_DOMAINS.includes(remainingHostname)) {
        return remainingHostname;
      }
      if (DECORATABLE_ALIASES[remainingHostname]) {
        return DECORATABLE_ALIASES[remainingHostname];
      }
    }

    return null;
  } catch {
    return null;
  }
};

const idIn = (path: string, pattern: RegExp): string | null => {
  const m = path.match(pattern);
  return m ? `#${m[1]}` : null;
};

const queryId = (u: URL): string | null => {
  const id = u.searchParams.get('id');
  return id && /^\d+$/.test(id) ? `#${id}` : null;
};

const mastodonLabel = (u: URL): string | null => {
  const post = u.pathname.match(/^\/@([^/]+)\/(\d+)/);
  if (post) return `@${post[1]}/${post[2]}`;
  const profile = u.pathname.match(/^\/@([^/]+)/);
  return profile ? `@${profile[1]}` : null;
};

const trimBskyHandle = (handle: string): string =>
  handle.replace(/\.bsky\.social$/, '');

const DISPLAY_RULES: Record<string, (u: URL) => string | null> = {
  'furaffinity.net': (u) => {
    const view = u.pathname.match(/\/(?:view|full)\/(\d+)/);
    if (view) return `#${view[1]}${u.search}`;
    const user = u.pathname.match(/^\/user\/([^/]+)/);
    if (user) return `@${user[1]}`;
    const cdn = u.pathname.match(/\/art\/([^/]+)\/(?:\d+\/)?([^/]+)$/);
    if (cdn) return `${cdn[1]}/${cdn[2]}${u.search}`;
    return null;
  },
  'twitter.com': (u) => {
    // Twitter serves /i/status and /i/web/status urls with no handle in the
    // path, so the name comes from the verifier's author.
    const status = u.pathname.match(/^\/([^/]+)(?:\/web)?\/status\/(\d+)/);
    if (status) {
      return status[1] === 'i' ? `#${status[2]}` : `@${status[1]}/${status[2]}`;
    }
    const profile = u.pathname.replace(/^\/+|\/+$/g, '');
    if (!profile || profile.includes('/') || profile === 'i') return null;
    return `@${profile}`;
  },
  'pixiv.net': (u) => {
    const art = u.pathname.match(/artworks\/(\d+)/);
    if (art) return `#${art[1]}`;
    const user = u.pathname.match(/users\/(\d+)/);
    return user ? `user ${user[1]}` : null;
  },
  'inkbunny.net': (u) => {
    const m = u.pathname.match(/\/s\/(\d+)/);
    return m ? `#${m[1]}` : null;
  },
  'e621.net': (u) => {
    const m = u.pathname.match(/\/posts?\/(\d+)/);
    return m ? `#${m[1]}` : null;
  },
  'deviantart.com': (u) => {
    const m = u.pathname.match(/^\/([^/]+)\/art\//);
    return m ? `@${m[1]}` : null;
  },
  'weasyl.com': (u) => {
    const m = u.pathname.match(/submissions?\/(\d+)/);
    return m ? `#${m[1]}` : null;
  },
  'newgrounds.com': (u) => {
    const art = u.pathname.match(/\/art\/view\/([^/]+)\/([^/]+)/);
    if (art) return `@${art[1]}/${art[2]}`;
    const portal = u.pathname.match(/\/(?:portal\/view|dump\/item)\/(\w+)/);
    if (portal) return `#${portal[1]}`;
    const sub = u.hostname.match(/^([^.]+)\.newgrounds\.com$/);
    if (sub && sub[1] !== 'www') return `@${sub[1]}`;
    return null;
  },
  'bsky.app': (u) => {
    const m = u.pathname.match(/^\/profile\/([^/]+)(?:\/post\/([^/]+))?/);
    if (!m) return null;
    if (m[1].startsWith('did:')) return m[2] ? `#${m[2]}` : m[1];
    const handle = trimBskyHandle(m[1]);
    return m[2] ? `@${handle}/${m[2]}` : `@${handle}`;
  },
  'mastodon.social': mastodonLabel,
  'pawoo.net': mastodonLabel,
  'tumblr.com': (u) => {
    const sub = u.hostname.match(/^([^.]+)\.tumblr\.com$/);
    if (sub && sub[1] !== 'www') {
      const post = u.pathname.match(/\/post\/(\d+)/);
      return post ? `@${sub[1]}/#${post[1]}` : `@${sub[1]}`;
    }
    const m = u.pathname.match(/^\/([^/]+)\/(\d+)/);
    return m ? `@${m[1]}/#${m[2]}` : null;
  },
  'reddit.com': (u) => {
    const sub = u.pathname.match(/^\/r\/([^/]+)/);
    if (sub) return `r/${sub[1]}`;
    const user = u.pathname.match(/^\/(?:u|user)\/([^/]+)/);
    return user ? `u/${user[1]}` : null;
  },
  'instagram.com': (u) => idIn(u.pathname, /\/(?:p|reel)\/([^/]+)/),
  'aryion.com': (u) => idIn(u.pathname, /\/g4\/view\/(\d+)/),
  'derpibooru.org': (u) =>
    idIn(u.pathname, /\/images\/(\d+)/) ?? idIn(u.pathname, /^\/(\d+)/),
  'furrynetwork.com': (u) => idIn(u.pathname, /\/artwork\/(\d+)/),
  'itaku.ee': (u) => idIn(u.pathname, /\/images\/(\d+)/),
  'piczel.tv': (u) => idIn(u.pathname, /\/gallery\/image\/(\d+)/),
  'pillowfort.social': (u) => idIn(u.pathname, /\/posts\/(\d+)/),
  'snootbooru.com': (u) => idIn(u.pathname, /\/post\/(\d+)/),
  'sofurry.com': (u) => idIn(u.pathname, /\/s\/(\d+)/),
  'rule34.paheal.net': (u) => idIn(u.pathname, /\/post\/view\/(\d+)/),
  'trello.com': (u) => idIn(u.pathname, /^\/c\/([^/]+)/),
  'bilibili.com': (u) =>
    idIn(u.pathname, /\/opus\/(\d+)/) ?? idIn(u.pathname, /^\/(\d+)/),
  'hentai-foundry.com': (u) => {
    const m = u.pathname.match(/\/pictures\/user\/([^/]+)/);
    return m ? `@${m[1]}` : null;
  },
  'gelbooru.com': queryId,
  'rule34.xxx': queryId,
  'steamcommunity.com': queryId,
  'the-collection.booru.org': (u) =>
    idIn(u.pathname, /\/post\/view\/(\d+)/) ?? queryId(u),
  'commishes.com': (u) => idIn(u.pathname, /\/auction\/show\/([^/?]+)/),
  'desuarchive.org': (u) =>
    idIn(u.hash, /(\d+)/) ?? idIn(u.pathname, /\/thread\/(\d+)/),
};

export const getSourceDisplayLabel = (url: string): string => {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }

  const canonical = getHostnameForLink(url);
  if (canonical && DISPLAY_RULES[canonical]) {
    const label = DISPLAY_RULES[canonical](u);
    if (label) return label;
  }

  const segments = u.pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (last && /\.[a-z0-9]{2,4}$/i.test(last)) {
    try {
      return decodeURIComponent(last);
    } catch {
      return last;
    }
  }

  const host = u.hostname.replace(/^www\./, '');
  const path = u.pathname.replace(/\/+$/, '');
  return `${host}${path}${u.search}`;
};
