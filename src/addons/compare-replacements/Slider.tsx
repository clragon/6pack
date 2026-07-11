import { SliderChrome } from './SliderChrome';
import { useZoomPan } from './zoomPan';
import type { CompareImage } from './types';

export function Slider({
  current,
  candidate,
}: {
  current: CompareImage;
  candidate: CompareImage;
}) {
  const z = useZoomPan(current.width, current.height);
  return (
    <div
      ref={z.ref}
      class="sp-cmp-slider"
      onMouseDown={z.onMouseDown}
      onTouchStart={z.onTouchStart}
      onDblClick={z.onDblClick}
    >
      <img
        class="sp-cmp-slider-img"
        style={z.imgStyle}
        src={current.full}
        alt={current.label}
        draggable={false}
      />
      <div class="sp-cmp-slider-clip" style={{ clipPath: z.clip }}>
        <img
          class="sp-cmp-slider-img"
          style={z.imgStyle}
          src={candidate.full}
          alt={candidate.label}
          draggable={false}
        />
      </div>
      <SliderChrome
        pos={z.pos}
        leftLabel={current.label}
        rightLabel={candidate.label}
        onSwap={z.swap}
      />
    </div>
  );
}
