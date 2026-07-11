import { ArrowLeftRight } from 'lucide-preact';

export function SliderChrome({
  pos,
  leftLabel,
  rightLabel,
  onSwap,
}: {
  pos: number;
  leftLabel: string;
  rightLabel: string;
  onSwap: () => void;
}) {
  return (
    <>
      <div class="sp-cmp-slider-line" style={{ left: `${pos}%` }} />
      <div class="sp-cmp-slider-handle" style={{ left: `${pos}%` }}>
        <ArrowLeftRight size={16} />
      </div>
      <span class="sp-cmp-slider-tag sp-cmp-slider-tag-left">{leftLabel}</span>
      <span class="sp-cmp-slider-tag sp-cmp-slider-tag-right">
        {rightLabel}
      </span>
      <button
        type="button"
        class="sp-cmp-slider-swap"
        title="Swap sides"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSwap();
        }}
      >
        <ArrowLeftRight size={14} />
      </button>
    </>
  );
}
