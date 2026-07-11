import { useRef, useState } from 'preact/hooks';
import { Columns2, Grid2x2, MoveHorizontal } from 'lucide-preact';

import { readJson, writeJson } from '../../core/storage';
import { Heatmap } from './Heatmap';
import { SideBySide } from './SideBySide';
import { Slider } from './Slider';
import { VideoStage } from './video/VideoStage';
import type { Playback } from './video/sync';
import type { CompareData } from './types';

type Mode = 'side-by-side' | 'slider' | 'heatmap';

const MODE_KEY = 'sp.compare-replacements.mode';

const MODES: { id: Mode; title: string; Icon: typeof Columns2 }[] = [
  { id: 'side-by-side', title: 'Side by side', Icon: Columns2 },
  { id: 'slider', title: 'Slider', Icon: MoveHorizontal },
  { id: 'heatmap', title: 'Diff heatmap', Icon: Grid2x2 },
];

export function Comparison({ data }: { data: CompareData }) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>(() =>
    readJson<Mode>(MODE_KEY, 'side-by-side'),
  );
  const shared = useRef<Playback>({ time: 0, playing: false });

  const candidate = data.candidates[index] ?? data.candidates[0];
  const bothVideo = data.current.video && candidate.video;
  // A replacement that swaps media type can't sync or wipe, so it only gets the
  // per-cell side-by-side.
  const mixed = !bothVideo && (data.current.video || candidate.video);
  const effective: Mode = mixed ? 'side-by-side' : mode;

  const chooseMode = (next: Mode) => {
    setMode(next);
    writeJson(MODE_KEY, next);
  };

  const view = bothVideo ? (
    <VideoStage
      key={candidate.key}
      current={data.current}
      candidate={candidate}
      mode={effective}
      shared={shared}
    />
  ) : effective === 'slider' ? (
    <Slider current={data.current} candidate={candidate} />
  ) : effective === 'heatmap' ? (
    <Heatmap current={data.current} candidate={candidate} />
  ) : (
    <SideBySide current={data.current} candidate={candidate} />
  );

  return (
    <div class="sp-cmp">
      <div class="sp-cmp-head">
        <span class="sp-cmp-title">Compare replacement</span>
        {data.candidates.length > 1 && (
          <div class="sp-cmp-pills">
            {data.candidates.map((item, i) => (
              <button
                key={item.key}
                type="button"
                class={`sp-cmp-pill${i === index ? ' sp-cmp-pill-on' : ''}`}
                onClick={() => setIndex(i)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
        <div class="sp-cmp-modes">
          {MODES.map(({ id, title, Icon }) => {
            const disabled = mixed && id !== 'side-by-side';
            return (
              <button
                key={id}
                type="button"
                class={`sp-cmp-mode${effective === id ? ' sp-cmp-mode-on' : ''}`}
                title={disabled ? 'Mixed media' : title}
                disabled={disabled}
                onClick={() => chooseMode(id)}
              >
                <Icon size={15} />
                <span>{title}</span>
              </button>
            );
          })}
        </div>
      </div>
      {view}
    </div>
  );
}
