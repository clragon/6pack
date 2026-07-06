import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Download } from 'lucide-preact';

import { convertDirectUrl } from './convert';
import { isDownloadable, looksLikeFile } from './download';
import { DIRECT_URL, readDirectUrl } from './upload';
import { ensureStyles } from './styles';

function offerable(url: string | null): boolean {
  return url !== null && looksLikeFile(url) && isDownloadable(url);
}

function Button({ input }: { input: HTMLInputElement }) {
  const [url, setUrl] = useState(readDirectUrl());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => setUrl(readDirectUrl());
    input.addEventListener('input', sync);
    return () => input.removeEventListener('input', sync);
  }, [input]);

  const run = async () => {
    setBusy(true);
    try {
      await convertDirectUrl();
    } finally {
      setBusy(false);
    }
  };

  if (!busy && !offerable(url)) return null;
  return (
    <button
      type="button"
      class="sp-fuh-btn"
      disabled={busy}
      title="Upload a link e621 can't fetch on its own"
      onClick={run}
    >
      <Download size={14} />
      <span>{busy ? 'Fetching…' : 'Fetch file'}</span>
    </button>
  );
}

// e621's file_input.vue unmounts the URL input once a file is attached, so the
// pill follows whichever input is present.
export function mountButton(): () => void {
  ensureStyles();
  let host: HTMLElement | null = null;
  let current: HTMLInputElement | null = null;

  const teardownHost = () => {
    if (!host) return;
    render(null, host);
    host.remove();
    host = null;
    current = null;
  };

  const sync = () => {
    const input = document.querySelector<HTMLInputElement>(DIRECT_URL);
    if (!input) {
      teardownHost();
      return;
    }
    if (input === current && host?.isConnected) return;
    teardownHost();
    current = input;
    host = document.createElement('span');
    host.className = 'sp-fuh-host';
    input.insertAdjacentElement('afterend', host);
    render(<Button input={input} />, host);
  };

  sync();
  const observer = new MutationObserver(sync);
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    teardownHost();
  };
}
