import type { Action } from '../../core/actions/types';
import type { PageContext } from '../../core/context/types';
import type { SixpackAddon } from '../../core/addons/types';
import { mountButton } from './button';
import { convertDirectUrl } from './convert';
import { looksLikeFile } from './download';
import { readDirectUrl } from './upload';

function isUploadForm(page: PageContext): boolean {
  return page.kind === 'upload' || page.kind === 'postReplacement';
}

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
    if (!isUploadForm(page)) return false;
    const url = readDirectUrl();
    return url !== null && looksLikeFile(url);
  },
  run: () => void convertDirectUrl(),
};

export const fileUploadHelperAddon: SixpackAddon = {
  id: 'file-upload-helper',
  name: 'File Upload Helper',
  description:
    "Grabs the image from sites that refuse e621's downloader and drops it into the upload form.",
  when: isUploadForm,
  actions: [fixUpload],
  setup: (ctx) => {
    let teardown: (() => void) | undefined;
    ctx.whenReady(() => {
      teardown = mountButton();
    });
    return () => teardown?.();
  },
};
