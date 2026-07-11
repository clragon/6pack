import { bytes } from './format';
import type { CompareImage } from './types';

export function MediaTag({ image }: { image: CompareImage }) {
  const meta = [
    image.width && image.height ? `${image.width}×${image.height}` : null,
    image.ext ? image.ext.toUpperCase() : null,
    image.size != null ? bytes(image.size) : null,
  ].filter(Boolean);
  return (
    <div class="sp-cmp-cell-tag">
      {image.href ? (
        <a class="sp-cmp-cell-label" href={image.href}>
          {image.label}
        </a>
      ) : (
        <span class="sp-cmp-cell-label">{image.label}</span>
      )}
      {meta.length > 0 && (
        <span class="sp-cmp-cell-meta">{meta.join(' · ')}</span>
      )}
    </div>
  );
}
