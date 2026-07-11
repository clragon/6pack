import { useEffect, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';
import { Eye, EyeOff } from 'lucide-preact';

import { MediaTag } from '../MediaTag';
import { SliderChrome } from '../SliderChrome';
import { diffFrame, fetchObjectUrl } from '../diff';
import { useZoomPan } from '../zoomPan';
import type { CompareImage } from '../types';
import { Transport } from './Transport';
import { useSyncedPair, type Playback } from './sync';

export type VideoMode = 'side-by-side' | 'slider' | 'heatmap';

// One pair of <video>s serves all three tabs: the element stays mounted while the
// mode only re-styles it, so switching tabs never reloads or reseeks. Both load as
// same-origin blobs so playback stays in sync and the heatmap can read frames.
export function VideoStage({
  current,
  candidate,
  mode,
  shared,
}: {
  current: CompareImage;
  candidate: CompareImage;
  mode: VideoMode;
  shared: RefObject<Playback>;
}) {
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [srcs, setSrcs] = useState<{ a: string; b: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [underlay, setUnderlay] = useState(true);
  const [percent, setPercent] = useState<number | null>(null);
  const transport = useSyncedPair(a, b, shared);

  const slider = mode === 'slider';
  const heatmap = mode === 'heatmap';
  const side = mode === 'side-by-side';
  const z = useZoomPan(current.width, current.height, slider);

  // Both sides load as same-origin blobs. The replacement is auth-gated and
  // CORS-less (no crossorigin stream), and matching the current to it keeps sync
  // smooth: a streamed half stalls and drifts against a local one.
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchObjectUrl(current.full),
      fetchObjectUrl(candidate.full),
    ]).then(
      ([ua, ub]) => alive && setSrcs({ a: ua, b: ub }),
      (e: unknown) =>
        alive && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      alive = false;
    };
  }, [current.full, candidate.full]);

  useEffect(() => {
    if (!heatmap || transport.playing) return;
    const av = a.current;
    const bv = b.current;
    const cv = canvas.current;
    if (!av || !bv || !cv) return;
    let raf = 0;
    let lastDiffed = -1;
    // Pause-to-diff: only once both frames have settled onto the same time, and
    // only once per frame (a scrub re-diffs; sitting still doesn't).
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (av.readyState < 2 || bv.readyState < 2) return;
      if (Math.abs(av.currentTime - bv.currentTime) > 0.02) return;
      if (av.currentTime === lastDiffed) return;
      try {
        const p = diffFrame(av, bv, cv);
        if (p !== null) {
          setPercent(p);
          lastDiffed = av.currentTime;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [heatmap, transport.playing]);

  // Drop the stale diff whenever the frame is about to change (play, or a scrub),
  // so pausing/scrubbing shows the spinner until the fresh aligned diff lands.
  useEffect(() => {
    setPercent(null);
  }, [transport.playing]);

  const seek = (t: number) => {
    setPercent(null);
    transport.seek(t);
  };

  const showDiff = heatmap && !transport.playing;
  const loading = !error && (srcs === null || transport.duration === 0);
  const styleA = slider
    ? z.imgStyle
    : heatmap
      ? { opacity: showDiff && underlay ? 0.5 : showDiff ? 0 : 1 }
      : undefined;
  const styleB = slider ? { ...z.imgStyle, clipPath: z.clip } : undefined;
  const onClick = slider ? undefined : transport.toggle;
  const clickable = onClick ? 'sp-cmp-vid-click' : '';

  return (
    <div class="sp-cmp-vid">
      <div
        ref={z.ref}
        class={`sp-cmp-vstage ${side ? 'is-side' : slider ? 'is-slider' : 'is-heatmap'}`}
        onMouseDown={slider ? z.onMouseDown : undefined}
        onTouchStart={slider ? z.onTouchStart : undefined}
        onDblClick={slider ? z.onDblClick : undefined}
      >
        <div class="sp-cmp-vwrap sp-cmp-vwrap-a">
          <video
            ref={a}
            class={clickable}
            style={styleA}
            src={srcs?.a}
            muted
            playsInline
            preload="auto"
            onClick={onClick}
            onError={() => setError('current video failed to load')}
          />
          {side && <MediaTag image={current} />}
        </div>
        <div class="sp-cmp-vwrap sp-cmp-vwrap-b">
          <video
            ref={b}
            class={clickable}
            style={styleB}
            src={srcs?.b}
            muted
            playsInline
            preload="auto"
            onClick={onClick}
            onError={() => setError('replacement video failed to load')}
          />
          {side && <MediaTag image={candidate} />}
        </div>

        {showDiff && <canvas ref={canvas} class="sp-cmp-vstage-diff" />}
        {showDiff && (
          <button
            type="button"
            class="sp-cmp-heat-toggle"
            title={underlay ? 'Hide frame underlay' : 'Show frame underlay'}
            onClick={() => setUnderlay((v) => !v)}
          >
            {underlay ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        {error && (
          <div class="sp-cmp-heat-status sp-cmp-heat-error">{error}</div>
        )}
        {loading && (
          <div class="sp-cmp-heat-status">
            <span class="sp-cmp-spinner" />
            loading video…
          </div>
        )}
        {showDiff && !loading && percent === null && (
          <div class="sp-cmp-heat-status">
            <span class="sp-cmp-spinner" />
            computing diff…
          </div>
        )}
        {showDiff && !loading && percent !== null && (
          <div class="sp-cmp-vstat">
            <span class="sp-cmp-legend-swatch" />
            {percent.toFixed(1)}% divergent
          </div>
        )}

        {slider && (
          <SliderChrome
            pos={z.pos}
            leftLabel={current.label}
            rightLabel={candidate.label}
            onSwap={z.swap}
          />
        )}
      </div>
      <Transport {...transport} seek={seek} />
    </div>
  );
}
