import { useEffect, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';

// currentTime reports a seek target the moment it is assigned, while
// requestVideoFrameCallback mediaTime names the frame the element presented.
export interface FrameClock {
  mediaTime: number | null;
  frameDuration: number | null;
}

export const EMPTY_CLOCK: FrameClock = { mediaTime: null, frameDuration: null };

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
