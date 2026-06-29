import {
  GM_xmlhttpRequest,
  unsafeWindow,
} from 'vite-plugin-monkey/dist/client';
import { readJson, writeJson } from '../storage';
import { log } from '../log';

// Where managed add-on artifacts live. In dev the running vite server serves
// public/addons; a later phase resolves this from a repo's release instead.
const BASE_URL = 'http://127.0.0.1:5837/addons/';

// Stashed artifact code, so a return visit runs the add-on without a refetch.
const CACHE_PREFIX = 'addons.code.';

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

// Run an add-on's body in 6pack's world, injecting unsafeWindow so it reaches
// the already-published bridge. The userscript header is just comments, ignored
// by eval; 6pack honors what it would have meant instead (managed add-ons
// inherit 6pack's grants and add none). Running here (not as a separate
// userscript) is what makes the add-on lifecycle-owned: it loads only while
// enabled and dies with 6pack.
function runCode(code: string): void {
  new Function('unsafeWindow', code)(unsafeWindow);
}

// Load an add-on, stashing its code for next time. A cached artifact runs
// synchronously, so it can register before first paint, then revalidates in the
// background; an uncached one fetches first, so only its first-ever load lags.
export function loadAddon(id: string, file: string): void {
  const cached = readJson<string | null>(CACHE_PREFIX + file, null);
  if (cached) {
    try {
      runCode(cached);
    } catch (error) {
      log.error(`addon ${id} cached run failed: ${describe(error)}`);
    }
    void revalidate(file);
    return;
  }
  void fetchCode(file)
    .then((code) => {
      writeJson(CACHE_PREFIX + file, code);
      runCode(code);
    })
    .catch((error) =>
      log.error(`addon ${id} failed to load: ${describe(error)}`),
    );
}

// Refresh the stash for the next load; a failure keeps the stale copy.
async function revalidate(file: string): Promise<void> {
  try {
    writeJson(CACHE_PREFIX + file, await fetchCode(file));
  } catch {
    // offline or server down: the cached copy still ran, so just wait it out
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
