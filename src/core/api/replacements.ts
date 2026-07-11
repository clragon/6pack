import { transport } from '../auth';

// UploadService::Replacer#process! in e621ng also makes the replacement
// creator the uploader, and the approve button reads data-penalize.
export function approveReplacement(
  id: number,
  penalize: boolean,
): Promise<unknown> {
  return transport.put(`/post_replacements/${id}/approve.json`, {
    penalize_current_uploader: penalize,
  });
}
