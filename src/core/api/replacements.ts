import { transport } from '../auth';

// Approve a pending replacement. `penalize` marks the replaced uploader's stats,
// mirroring the row's data-penalize (true when the current uploader differs from
// the replacement creator). Approval also reassigns the post's uploader to the
// replacement creator.
export function approveReplacement(
  id: number,
  penalize: boolean,
): Promise<unknown> {
  return transport.put(`/post_replacements/${id}/approve.json`, {
    penalize_current_uploader: penalize,
  });
}
