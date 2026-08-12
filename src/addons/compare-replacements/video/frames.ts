import { useEffect, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';

// What the element has actually put on screen. `currentTime` reports the seek
// target the moment it is assigned, while the frame arrives later, so only a
// clock built from presentations states which frame is showing.
export interface FrameClock {
  mediaTime: number | null;
  // No API states a frame's length, so it is measured from consecutive
  // presentations. Null until two frames have been seen.
  frameDuration: number | null;
}

export const EMPTY_CLOCK: FrameClock = { mediaTime: null, frameDuration: null };

// Stands in until playback reveals the real one, erring long so that no caller
// is held to an alignment finer than a frame.
export const FALLBACK_FRAME = 1 / 24;

const SAMPLE_SIZE = 24;
const MIN_FRAME = 1 / 240;
const MAX_FRAME = 1 / 5;

export function useFrameClock(
  video: RefObject<HTMLVideoElement>,
): RefObject<FrameClock> {
  const clock = useRef<FrameClock>({ mediaTime: null, frameDuration: null });

  useEffect(() => {
    const el = video.current;
    if (!el || !('requestVideoFrameCallback' in el)) return;
    let alive = true;
    let handle = 0;
    let previous: number | null = null;
    const recent: number[] = [];

    const step = (_now: number, metadata: VideoFrameCallbackMetadata) => {
      if (!alive) return;
      const time = metadata.mediaTime;
      if (previous !== null) {
        // The median of a sliding window, so a dropped frame stretches one gap
        // without the estimate keeping that outlier for the element's lifetime.
        const delta = time - previous;
        if (delta >= MIN_FRAME && delta <= MAX_FRAME) {
          recent.push(delta);
          if (recent.length > SAMPLE_SIZE) recent.shift();
          const sorted = [...recent].sort((x, y) => x - y);
          clock.current.frameDuration = sorted[sorted.length >> 1]!;
        }
      }
      previous = time;
      clock.current.mediaTime = time;
      handle = el.requestVideoFrameCallback(step);
    };

    handle = el.requestVideoFrameCallback(step);
    return () => {
      alive = false;
      el.cancelVideoFrameCallback(handle);
    };
  }, [video]);

  return clock;
}

export function frameLength(clock: FrameClock): number {
  return clock.frameDuration ?? FALLBACK_FRAME;
}
