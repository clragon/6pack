import {
  GM_xmlhttpRequest,
  unsafeWindow,
} from 'vite-plugin-monkey/dist/client';

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

export async function loadAddon(file: string): Promise<void> {
  const code = await fetchCode(file);
  new Function('unsafeWindow', code)(unsafeWindow);
}
