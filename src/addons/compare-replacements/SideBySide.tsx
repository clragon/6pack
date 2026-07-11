import { MediaTag } from './MediaTag';
import { signedBytes } from './format';
import type { CompareImage } from './types';

function Media({ image }: { image: CompareImage }) {
  return image.video ? (
    <video src={image.full} muted playsInline controls />
  ) : (
    <img src={image.full} alt={image.label} loading="lazy" />
  );
}

export function SideBySide({
  current,
  candidate,
}: {
  current: CompareImage;
  candidate: CompareImage;
}) {
  const delta =
    current.size != null && candidate.size != null
      ? candidate.size - current.size
      : null;
  return (
    <div class="sp-cmp-side">
      <div class="sp-cmp-cell">
        <Media image={current} />
        <MediaTag image={current} />
      </div>
      <div class="sp-cmp-side-second">
        <div class="sp-cmp-cell">
          <Media image={candidate} />
          <MediaTag image={candidate} />
        </div>
        {delta != null && delta !== 0 && (
          <div class="sp-cmp-delta">{signedBytes(delta)}</div>
        )}
      </div>
    </div>
  );
}
