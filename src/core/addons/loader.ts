import {
  GM_xmlhttpRequest,
  unsafeWindow,
} from 'vite-plugin-monkey/dist/client';
import { readJson, writeJson } from '../storage';
import { log } from '../log';

// Where managed add-on artifacts live: the vite server in dev, a GitHub release
// otherwise (see addonBase in vite.config.ts).
const BASE_URL = __ADDON_BASE__;

// Stashed artifact code, so a return visit runs the add-on without a refetch.
// The base is part of the key, so an artifact cached against one release is a
// miss under the next: an update refetches rather than running the previous
// release's add-on against this one's bridge.
const CACHE_PREFIX = 'addons.code.';

function cacheKey(file: string): string {
  return CACHE_PREFIX + BASE_URL + file;
}

// Artifacts stashed against any other base are unreachable once the base moves,
// so they are dropped on the first load that needs one.
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
    // storage unavailable: nothing cached, so nothing to drop
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

// Run an add-on's body in 6pack's world. A new Function body resolves free names
// against the global scope, not 6pack's grant closure, so the bindings the
// artifact compiled against are passed in: unsafeWindow to reach the published
// bridge, and GM_xmlhttpRequest so its `typeof` guard finds the granted function.
// The userscript header is inert comments here; managed add-ons inherit 6pack's
// grants and add none. Running in-process (not as a separate userscript) keeps
// the add-on lifecycle-owned: it loads only while enabled and dies with 6pack.
function runCode(code: string): void {
  new Function('unsafeWindow', 'GM_xmlhttpRequest', code)(
    unsafeWindow,
    GM_xmlhttpRequest,
  );
}

// Load an add-on, stashing its code for next time. A cached artifact runs
// synchronously, so it can register before first paint, then revalidates in the
// background; an uncached one fetches first, so only its first-ever load lags.
export function loadAddon(
  id: string,
  file: string,
  onFailure: (reason: string) => void,
): void {
  evictOtherBases();
  // Dev serves a watched, freshly-built artifact, so a cached copy would just
  // re-run last reload's code; always refetch instead.
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

// Refresh the stash for the next load; a failure keeps the stale copy.
async function revalidate(file: string): Promise<void> {
  try {
    writeJson(cacheKey(file), await fetchCode(file));
  } catch {
    // offline or server down: the cached copy still ran, so just wait it out
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
