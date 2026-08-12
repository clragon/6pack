import { useEffect, useRef, useState } from 'preact/hooks';
import { Eye, EyeOff } from 'lucide-preact';

import { computeDiff, type DiffResult } from './diff';
import { signedBytes, pixels } from './format';
import type { CompareImage } from './types';

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; diff: DiffResult };

const EMPTY = '-';

export function Heatmap({
  current,
  candidate,
}: {
  current: CompareImage;
  candidate: CompareImage;
}) {
  const [underlay, setUnderlay] = useState(true);
  const [underlayFailed, setUnderlayFailed] = useState(false);
  const [state, setState] = useState<State>({ phase: 'loading' });
  const heat = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let mounted = true;
    setState({ phase: 'loading' });
    setUnderlayFailed(false);
    computeDiff(current.full, candidate.full).then(
      (diff) => {
        if (mounted) setState({ phase: 'ready', diff });
      },
      (error: unknown) => {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : String(error);
        setState({ phase: 'error', message });
      },
    );
    return () => {
      mounted = false;
    };
  }, [current.full, candidate.full]);

  const diff = state.phase === 'ready' ? state.diff : null;

  // e621's img-src admits no blob: url, so the overlay goes onto the canvas
  // directly.
  useEffect(() => {
    const canvas = heat.current;
    if (!diff || !canvas) return;
    canvas.width = diff.width;
    canvas.height = diff.height;
    canvas.getContext('2d')?.putImageData(diff.heat, 0, 0);
  }, [diff]);

  const failure =
    state.phase === 'error'
      ? `failed to compute diff: ${state.message}`
      : underlayFailed && underlay
        ? `failed to load underlay: ${current.label}`
        : null;

  return (
    <div class="sp-cmp-heat">
      <div class="sp-cmp-heat-stage">
        <div class="sp-cmp-heat-frame">
          {underlay && (
            <img
              class="sp-cmp-heat-under"
              src={current.full}
              alt={current.label}
              onError={() => setUnderlayFailed(true)}
            />
          )}
          {diff && (
            <canvas
              ref={heat}
              class="sp-cmp-heat-diff"
              role="img"
              aria-label="difference heatmap"
              style={{ mixBlendMode: underlay ? 'screen' : 'normal' }}
            />
          )}
          {state.phase === 'loading' && (
            <div class="sp-cmp-heat-status">
              <span class="sp-cmp-spinner" />
              computing diff…
            </div>
          )}
          {failure && (
            <div class="sp-cmp-heat-status sp-cmp-heat-error">{failure}</div>
          )}
          <button
            type="button"
            class="sp-cmp-heat-toggle"
            title={underlay ? 'Hide image underlay' : 'Show image underlay'}
            onClick={() => setUnderlay((v) => !v)}
          >
            {underlay ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <div class="sp-cmp-heat-panel">
        <Stat
          label="divergent"
          value={diff ? `${diff.divergentPercent.toFixed(1)}%` : EMPTY}
        />
        <Stat
          label="Δ bytes"
          value={
            diff ? signedBytes(diff.candidateBytes - diff.currentBytes) : EMPTY
          }
        />
        <Stat
          label="Δ pixels"
          value={
            diff
              ? `${pixels(diff.currentPixels)} to ${pixels(diff.candidatePixels)}`
              : EMPTY
          }
          small
        />
        <div class="sp-cmp-legend">
          <span class="sp-cmp-legend-label">legend</span>
          <div class="sp-cmp-legend-row">
            <span class="sp-cmp-legend-swatch" />
            <span>divergent pixels</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div class="sp-cmp-stat">
      <span class="sp-cmp-stat-label">{label}</span>
      <span class={`sp-cmp-stat-value${small ? ' sp-cmp-stat-small' : ''}`}>
        {value}
      </span>
    </div>
  );
}
