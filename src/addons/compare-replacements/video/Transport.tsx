import { Pause, Play } from 'lucide-preact';

import { clock } from '../format';
import type { Transport as TransportState } from './sync';

export function Transport({
  playing,
  time,
  duration,
  toggle,
  seek,
}: TransportState) {
  return (
    <div class="sp-cmp-transport">
      <button
        type="button"
        class="sp-cmp-transport-btn"
        title={playing ? 'Pause' : 'Play'}
        onClick={toggle}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <input
        type="range"
        class="sp-cmp-transport-range"
        min={0}
        max={duration || 0}
        step="any"
        value={time}
        onInput={(e) => seek(Number((e.target as HTMLInputElement).value))}
      />
      <span class="sp-cmp-transport-time">
        {clock(time)} / {clock(duration)}
      </span>
    </div>
  );
}
