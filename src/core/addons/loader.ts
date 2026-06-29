import {
  GM_xmlhttpRequest,
  unsafeWindow,
} from 'vite-plugin-monkey/dist/client';
import { readJson, writeJson } from '../storage';
import { log } from '../log';

const BASE_URL = 'http://127.0.0.1:5837/addons/';

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

function runCode(code: string): void {
  new Function('unsafeWindow', code)(unsafeWindow);
}

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

async function revalidate(file: string): Promise<void> {
  try {
    writeJson(CACHE_PREFIX + file, await fetchCode(file));
  } catch {}
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
