import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { iconFor } from './icons';
import { domId, expand, isActive, pinnedEntries } from './resolve';
import { subscribe, type NavEntry } from './store';

// e621's mobile drawer shows this same menu element, so the tabs keep the li
// and a markup the site styles.
const MENU = 'menu.nav-primary';

// e621 puts the notification class on li#nav-forum when a followed topic has
// updates.
const NOTIFIED_TAB = 'li#nav-forum.notification';
const FORUM_PATH = '/forum_topics';

function usePinned(): NavEntry[] {
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);
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
