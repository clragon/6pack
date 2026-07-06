import type { Action } from '../../core/actions/types';
import type { SixpackAddon } from '../../core/addons/types';
import { mountButton } from './button';
import { convertDirectUrl } from './convert';
import { looksLikeFile } from './download';
import { readDirectUrl } from './upload';

const fixUpload: Action = {
  id: 'upload.fix-file',
  title: 'Convert direct source link to file upload',
  description: "Upload a link e621 can't fetch on its own",
  keywords: [
    'upload',
    'file',
    'fix',
    'download',
    'source',
    'direct',
    'url',
    'convert',
    'link',
  ],
  weight: 2,
  when: (page) => {
    if (page.kind !== 'upload') return false;
    const url = readDirectUrl();
    return url !== null && looksLikeFile(url);
  },
  run: () => void convertDirectUrl(),
};

export const fileUploadHelperAddon: SixpackAddon = {
  id: 'file-upload-helper',
  name: 'File Upload Helper',
  description:
    "Fetches links e621 can't grab itself and uploads them as files.",
  when: (page) => page.kind === 'upload',
  actions: [fixUpload],
  setup: (ctx) => {
    let teardown: (() => void) | undefined;
    ctx.whenReady(() => {
      teardown = mountButton();
    });
    return () => teardown?.();
  },
};
