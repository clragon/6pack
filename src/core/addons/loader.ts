import {
  GM_xmlhttpRequest,
  unsafeWindow,
} from 'vite-plugin-monkey/dist/client';
import { readJson, writeJson } from '../storage';
import { log } from '../log';

const BASE_URL = __ADDON_BASE__;

const CACHE_PREFIX = 'sp.core.addons.code.';

function cacheKey(file: string): string {
  return CACHE_PREFIX + BASE_URL + file;
}

let evicted = false;
function evictOtherBases(): void {
  if (evicted) return;
  evicted = true;
  try {
    const keep = CACHE_PREFIX + BASE_URL;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(CACHE_PREFIX) && !key.startsWith(keep)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Unavailable storage holds no cache, so there is nothing to drop.
  }
}

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

function runCode(code: string): void {
  // A Function body resolves free names on the global object and not in the
  // userscript manager's grant closure, so the grants pass in as parameters.
  new Function('unsafeWindow', 'GM_xmlhttpRequest', code)(
    unsafeWindow,
    GM_xmlhttpRequest,
  );
}

export function loadAddon(
  id: string,
  file: string,
  onFailure: (reason: string) => void,
): void {
  evictOtherBases();
  const cached = import.meta.env.DEV
    ? null
    : readJson<string | null>(cacheKey(file), null);
  if (cached) {
    try {
      runCode(cached);
    } catch (error) {
      const reason = describe(error);
      log.error(`addon ${id} cached run failed: ${reason}`);
      onFailure(reason);
    }
    void revalidate(file);
    return;
  }
  void fetchCode(file)
    .then((code) => {
      writeJson(cacheKey(file), code);
      runCode(code);
    })
    .catch((error: unknown) => {
      const reason = describe(error);
      log.error(`addon ${id} failed to load: ${reason}`);
      onFailure(reason);
    });
}

async function revalidate(file: string): Promise<void> {
  try {
    writeJson(cacheKey(file), await fetchCode(file));
  } catch {
    // Offline or a failing server keeps the cached copy that already ran.
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
