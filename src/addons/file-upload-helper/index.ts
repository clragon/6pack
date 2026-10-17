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
    'Artwork is fetched from hosts that decline to serve a file to e621, Twitter and pixiv among them, and attached to the upload form. An upload therefore proceeds from the source link alone, with no intermediate save to disk.',
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
