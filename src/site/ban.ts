// The new-ban form (/bans/new). As with feedback, the user_name field renders
// only for a new record.
export interface BanFormFields {
  userName: string;
  reason: string;
}

export function readBanForm(): BanFormFields | null {
  const userName = document.querySelector<HTMLInputElement>(
    'input[name="ban[user_name]"]',
  );
  const reason = document.querySelector<HTMLTextAreaElement>(
    'textarea[name="ban[reason]"]',
  );
  if (!userName || !reason) return null;
  return { userName: userName.value, reason: reason.value };
}

export interface BanSubject {
  id: number;
  name: string;
}

// The banned user on the ban show page (/bans/<id>), the only /users/ link in the
// show block. Null on every other page.
export function readBanSubjectUser(): BanSubject | null {
  const anchor = document.querySelector<HTMLAnchorElement>(
    '#c-bans #a-show a[href^="/users/"]',
  );
  if (!anchor) return null;
  const id = Number(anchor.getAttribute('href')?.match(/^\/users\/(\d+)/)?.[1]);
  if (!Number.isFinite(id)) return null;
  return { id, name: anchor.textContent?.trim() ?? '' };
}
