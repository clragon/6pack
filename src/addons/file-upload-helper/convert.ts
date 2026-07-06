import { downloadFile, downloadHost, isDownloadable } from './download';
import {
  addSource,
  clearDirectUrl,
  readDirectUrl,
  setUploadFile,
} from './upload';
import { notifyError, progress } from '../../site/toast';

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function convertDirectUrl(): Promise<void> {
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
