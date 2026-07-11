import { useEffect, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';

const NUDGE_BAND = 0.04;
const RESYNC_GAP = 0.5;

export interface Playback {
  time: number;
  playing: boolean;
}

export interface Transport {
  playing: boolean;
  time: number;
  duration: number;
  toggle: () => void;
  seek: (t: number) => void;
}

export function useSyncedPair(
  a: RefObject<HTMLVideoElement>,
  b: RefObject<HTMLVideoElement>,
  shared: RefObject<Playback>,
): Transport {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(shared.current?.time ?? 0);
  const [duration, setDuration] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const av = a.current;
    const bv = b.current;
    if (!av || !bv) return;
    av.muted = true;
    bv.muted = true;
    let seeded = false;
    const resolve = () => {
      const ad = av.duration;
      const bd = bv.duration;
      if (!Number.isFinite(ad) || !Number.isFinite(bd)) return;
      const dur = Math.min(ad, bd);
      setDuration(dur);
      if (!seeded) {
        seeded = true;
        const start = Math.min(shared.current?.time ?? 0, dur);
        av.currentTime = start;
        bv.currentTime = start;
        setTime(start);
      }
    };
    const events = ['loadedmetadata', 'durationchange', 'canplay'];
    for (const e of events) {
      av.addEventListener(e, resolve);
      bv.addEventListener(e, resolve);
    }
    resolve();
    return () => {
      for (const e of events) {
        av.removeEventListener(e, resolve);
        bv.removeEventListener(e, resolve);
      }
    };
  }, [a, b, shared]);

  useEffect(() => {
    if (!playing) return;
    const av = a.current;
    const bv = b.current;
    if (!av || !bv) return;
    const tick = () => {
      const dur = Math.min(av.duration || Infinity, bv.duration || Infinity);
      if (Number.isFinite(dur) && av.currentTime >= dur) {
        av.currentTime = 0;
        bv.currentTime = 0;
      }
      const drift = av.currentTime - bv.currentTime;
      const gap = Math.abs(drift);
      if (gap > RESYNC_GAP) {
        bv.currentTime = av.currentTime;
        bv.playbackRate = 1;
      } else if (gap > NUDGE_BAND) {
        bv.playbackRate = Math.max(0.5, Math.min(1.5, 1 + drift * 3));
      } else if (bv.playbackRate !== 1) {
        bv.playbackRate = 1;
      }
      const now = av.currentTime;
      setTime(now);
      if (shared.current) shared.current.time = now;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf.current);
      if (bv) bv.playbackRate = 1;
    };
  }, [playing, a, b, shared]);

  const toggle = () => {
    const av = a.current;
    const bv = b.current;
    if (!av || !bv) return;
    const next = !playing;
    if (next) {
      bv.playbackRate = 1;
      bv.currentTime = av.currentTime;
      void av.play();
      void bv.play();
    } else {
      av.pause();
      bv.pause();
      bv.playbackRate = 1;
      bv.currentTime = av.currentTime;
    }
    setPlaying(next);
    if (shared.current) shared.current.playing = next;
  };

  const seek = (t: number) => {
    const av = a.current;
    const bv = b.current;
    if (!av || !bv) return;
    av.currentTime = t;
    bv.currentTime = t;
    setTime(t);
    if (shared.current) shared.current.time = t;
  };

  return { playing, time, duration, toggle, seek };
}
