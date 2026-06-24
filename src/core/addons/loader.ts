import {
  GM_xmlhttpRequest,
  unsafeWindow,
} from 'vite-plugin-monkey/dist/client';

// Where managed add-on artifacts live. In dev the running vite server serves
// public/addons; a later phase resolves this from a repo's release instead.
const BASE_URL = 'http://127.0.0.1:5837/addons/';

function fetchCode(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url: BASE_URL + file,
      timeout: 15000,
      onload: (res) =>
        res.status >= 200 && res.status < 300
          ? resolve(res.responseText)
          : reject(new Error(`HTTP ${res.status}`)),
      onerror: () => reject(new Error('network error')),
      ontimeout: () => reject(new Error('timed out')),
    });
  });
}

// Fetch an add-on's userscript artifact and run its body in 6pack's world,
// injecting unsafeWindow so it reaches the already-published bridge. The
// userscript header is just comments, ignored by eval; 6pack honors what it
// would have meant instead (managed add-ons inherit 6pack's grants and add
// none). Running here (not as a separate userscript) is what makes the add-on
// lifecycle-owned: it loads only while enabled and dies with 6pack.
export async function loadAddon(file: string): Promise<void> {
  const code = await fetchCode(file);
  new Function('unsafeWindow', code)(unsafeWindow);
}
