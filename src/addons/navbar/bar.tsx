import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { iconFor } from './icons';
import { domId, expand, isActive, pinnedEntries } from './resolve';
import { navStore, type NavEntry } from './store';

// The primary ribbon, and the same element the mobile hamburger drawer shows.
const MENU = 'menu.nav-primary';

// e621 flags the forum tab when a followed topic has updates. The flag lives on
// a tab the takeover removes, so it is read first and put back on whichever
// entry leads to the forum.
const NOTIFIED_TAB = 'li#nav-forum.notification';
const FORUM_PATH = '/forum_topics';

function usePinned(): NavEntry[] {
  const [, force] = useState(0);
  useEffect(() => navStore.subscribe(() => force((n) => n + 1)), []);
  return pinnedEntries();
}

function Tab({ entry, notified }: { entry: NavEntry; notified: boolean }) {
  const Icon = iconFor(entry.icon);
  const id = domId(entry.title);
  const classes = [
    isActive(entry.url) ? 'current' : '',
    notified && expand(entry.url).startsWith(FORUM_PATH) ? 'notification' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <li id={id} class={classes || undefined}>
      <a id={id + '-link'} href={expand(entry.url)}>
        <Icon size={24} /> <span>{entry.title}</span>
      </a>
    </li>
  );
}

function Bar({ notified }: { notified: boolean }) {
  const entries = usePinned();
  return (
    <>
      {entries.map((entry) => (
        <Tab key={entry.id} entry={entry} notified={notified} />
      ))}
    </>
  );
}

// Takes over e621's primary ribbon, keeping its markup and classes so the site's
// own styling (and its mobile drawer) applies unchanged. The original tabs are
// held in a fragment, out of the document: hidden in it, their `nav-*` ids would
// answer lookups meant for the tabs on screen. Teardown puts them back.
export function mountBar(): () => void {
  const menu = document.querySelector<HTMLElement>(MENU);
  if (!menu) return () => {};

  const notified = menu.querySelector(NOTIFIED_TAB) !== null;
  const stash = document.createDocumentFragment();
  stash.append(...Array.from(menu.childNodes));

  render(<Bar notified={notified} />, menu);

  return () => {
    render(null, menu);
    menu.replaceChildren(stash);
  };
}
