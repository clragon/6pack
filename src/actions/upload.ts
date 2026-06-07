import type { Action } from '../core/actions/types';
import { downloadFile, downloadHost, isDownloadable, looksLikeFile } from '../core/download';
import { addSource, clearDirectUrl, readDirectUrl, setUploadFile } from '../site/upload';
import { notifyError, progress } from '../site/toast';

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Rescue an upload whose direct URL e621's server can't fetch: download the
// image here, keep the link as a source, and hand e621 the file instead.
async function fixFileUpload(): Promise<void> {
  const url = readDirectUrl();
  if (!url) {
    notifyError('No image URL to fix');
    return;
  }
  if (!isDownloadable(url)) {
    notifyError(`Can't download from ${downloadHost(url) ?? 'that host'}`);
    return;
  }

  const status = progress('Downloading image...');
  let file: File;
  try {
    file = await downloadFile(url);
  } catch (error) {
    status.finish(`Download failed: ${message(error)}`);
    return;
  }

  await addSource(url);
  clearDirectUrl();
  if (!(await setUploadFile(file))) {
    status.finish('Could not attach the downloaded file');
    return;
  }
  status.finish(`Replaced link with file ${file.name}`);
}

export const fixUpload: Action = {
  id: 'upload.fix-file',
  title: 'Convert direct source link to file upload',
  description: "Upload a link e621 can't fetch on its own",
  keywords: ['upload', 'file', 'fix', 'download', 'source', 'direct', 'url', 'convert', 'link'],
  weight: 2,
  when: (page) => {
    if (page.kind !== 'upload') return false;
    const url = readDirectUrl();
    return url !== null && looksLikeFile(url);
  },
  run: () => void fixFileUpload(),
};
