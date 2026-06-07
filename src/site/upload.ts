const DIRECT_URL = 'input[placeholder="Paste image URL"]';
const FILE_INPUT = '#file-input';
const SOURCE_ROW = '.upload-source-row input[type="text"]';
const ADD_SOURCE = '.upload-source-add';

function waitFor<T extends Element>(selector: string, timeoutMs = 1000): Promise<T | null> {
  const existing = document.querySelector<T>(selector);
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const found = document.querySelector<T>(selector);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector<T>(selector));
    }, timeoutMs);
  });
}

export function readDirectUrl(): string | null {
  const input = document.querySelector<HTMLInputElement>(DIRECT_URL);
  const value = input?.value.trim();
  return value ? value : null;
}

export function clearDirectUrl(): void {
  const input = document.querySelector<HTMLInputElement>(DIRECT_URL);
  if (!input) return;
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export async function addSource(url: string): Promise<boolean> {
  const rows = () => Array.from(document.querySelectorAll<HTMLInputElement>(SOURCE_ROW));
  let target = rows().find((row) => row.value.trim().length === 0);
  if (!target) {
    const add = document.querySelector<HTMLButtonElement>(ADD_SOURCE);
    if (!add) return false;
    const before = rows().length;
    add.click();
    await waitFor(SOURCE_ROW);
    target = rows()[before] ?? rows().at(-1);
  }
  if (!target) return false;
  target.value = url;
  target.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

export async function setUploadFile(file: File): Promise<boolean> {
  const input = await waitFor<HTMLInputElement>(FILE_INPUT);
  if (!input) return false;
  const data = new DataTransfer();
  data.items.add(file);
  input.files = data.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}
