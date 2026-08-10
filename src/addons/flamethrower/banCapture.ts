import { massBan } from './massBan';

// While a mass-ban is pending, capture the ban[*] fields the user submits on
// /bans/new so they can be replayed for the rest. FormData is exactly what the
// form posts, so the browser resolves checkboxes and hidden fields rather than
// us, and new fields like deny-login come along without being named here.
export function captureBanForm(): () => void {
  if (!massBan.get()) return () => {};
  const reason = document.querySelector('textarea[name="ban[reason]"]');
  const form = reason?.closest('form');
  if (!form) return () => {};

  const capture = (): void => {
    const fields: Record<string, string> = {};
    for (const [key, value] of new FormData(form).entries()) {
      const field = /^ban\[(.+)\]$/.exec(key)?.[1];
      if (!field || typeof value !== 'string') continue;
      if (field === 'user_name' || field === 'user_id') continue;
      fields[field] = value;
    }
    massBan.captureFields(fields);
  };

  form.addEventListener('submit', capture, true);
  return () => form.removeEventListener('submit', capture, true);
}
