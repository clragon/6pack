import { useEffect, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';
import { Eye, EyeOff } from 'lucide-preact';

import { MediaTag } from '../MediaTag';
import { SliderChrome } from '../SliderChrome';
import { diffFrame, resolveMediaPair } from '../diff';
import { useZoomPan } from '../zoomPan';
import type { CompareImage } from '../types';
import { Transport } from './Transport';
import { useSyncedPair, type Playback } from './sync';
import { EMPTY_CLOCK, frameLength, useFrameClock } from './frames';

export type VideoMode = 'side-by-side' | 'slider' | 'heatmap';

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
  const diffed = useRef('');
  const clockA = useFrameClock(a);
  const clockB = useFrameClock(b);
  const transport = useSyncedPair(a, b, shared, clockA, clockB);

  const slider = mode === 'slider';
  const heatmap = mode === 'heatmap';
  const side = mode === 'side-by-side';
  const z = useZoomPan(current.width, current.height, slider);

  useEffect(() => {
    let alive = true;
    resolveMediaPair(current.full, candidate.full).then(
      ([a, b]) => alive && setSrcs({ a, b }),
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
    let failed = false;
    const loop = () => {
      if (failed) return;
      raf = requestAnimationFrame(loop);
      if (av.seeking || bv.seeking) return;
      if (av.readyState < 2 || bv.readyState < 2) return;
      const ca = clockA.current ?? EMPTY_CLOCK;
      const cb = clockB.current ?? EMPTY_CLOCK;
      const at = ca.mediaTime ?? av.currentTime;
      const bt = cb.mediaTime ?? bv.currentTime;
      if (Math.abs(at - av.currentTime) > frameLength(ca)) return;
      if (Math.abs(bt - bv.currentTime) > frameLength(cb)) return;
      if (Math.abs(at - bt) > Math.max(frameLength(ca), frameLength(cb)))
        return;
      const pair = `${at}|${bt}`;
      if (pair === diffed.current) return;
      try {
        const p = diffFrame(av, bv, cv);
        if (p !== null) {
          setPercent(p);
          diffed.current = pair;
        }
      } catch (e) {
        failed = true;
        setError(e instanceof Error ? e.message : String(e));
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [heatmap, transport.playing, clockA, clockB]);

  useEffect(() => {
    setPercent(null);
    diffed.current = '';
  }, [transport.playing]);

  const seek = (t: number) => {
    setPercent(null);
    diffed.current = '';
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
